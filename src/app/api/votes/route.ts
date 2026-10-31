import { repositories } from "@/lib/repos";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { parseVoteRequest } from "@/lib/vote-request";

const knownRepositoryIds = new Set(repositories.map((repository) => repository.id));

function errorResponse(message: string, status: number, headers?: HeadersInit) {
  return Response.json({ error: message }, { status, headers });
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) {
    return errorResponse("Cross-origin vote requests are not allowed.", 403);
  }

  if (!request.headers.get("content-type")?.includes("application/json")) {
    return errorResponse("Content-Type must be application/json.", 415);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Request body must be valid JSON.", 400);
  }

  const voteRequest = parseVoteRequest(body, knownRepositoryIds);
  if (!voteRequest) {
    return errorResponse("Vote request is invalid.", 400);
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    console.error("Could not verify the voter:", authError);
    return errorResponse("Could not verify your login. Please try again.", 503);
  }
  if (!user) {
    return errorResponse("Sign in before voting.", 401);
  }

  const { data: score, error: voteError } = await supabase.rpc(
    "submit_repository_vote",
    {
      repository_id_input: voteRequest.repositoryId,
      vote_type_input: voteRequest.voteType,
    },
  );

  if (voteError) {
    if (
      voteError.code === "P0001" &&
      voteError.message === "vote_rate_limited"
    ) {
      return errorResponse("Vote limit reached. Try again in a minute.", 429, {
        "Retry-After": "60",
      });
    }
    if (voteError.code === "22023") {
      return errorResponse("Vote request is invalid.", 400);
    }
    if (voteError.code === "42501") {
      return errorResponse("Sign in before voting.", 401);
    }

    console.error("Could not save repository vote:", voteError);
    return errorResponse("Could not save your vote. Please try again.", 500);
  }

  if (typeof score !== "number" || !Number.isInteger(score)) {
    console.error("Vote RPC returned a non-integer score.");
    return errorResponse("The vote service returned an invalid score.", 502);
  }

  return Response.json({ score });
}

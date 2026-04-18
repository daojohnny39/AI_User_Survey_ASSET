import type { Survey, SubmissionPayload } from "@survey/shared";

export async function fetchSurvey(): Promise<Survey> {
  const res = await fetch("/api/survey");
  if (!res.ok) throw new Error(`Failed to load survey: ${res.status}`);
  return res.json();
}

export async function submitSurvey(
  payload: SubmissionPayload
): Promise<{ submission_id: string }> {
  const res = await fetch("/api/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw Object.assign(new Error(data.error ?? "Submit failed"), { data, status: res.status });
  return data;
}

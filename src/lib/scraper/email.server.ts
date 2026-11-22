// Email delivery for "Notify me". Returns true when an email was sent.
// Sending turns on once the project's email domain is set up.
export type CompanyJobsEmail = { company: string; jobs: { title: string; location: string; summary: string; url: string }[] };

export async function sendCompanyJobsEmail(_to: string, _data: CompanyJobsEmail, _idempotencyKey: string): Promise<boolean> {
  return false;
}

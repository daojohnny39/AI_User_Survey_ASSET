interface Props {
  submissionId: string;
}

export function ThankYouPage({ submissionId }: Props) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="mb-2 text-3xl font-bold text-slate-800">Thank You!</h1>
        <p className="mb-8 text-slate-600">Your responses have been recorded.</p>

        <div className="mb-8 rounded-lg bg-white p-4 shadow-sm border border-slate-200">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Submission ID
          </p>
          <code className="break-all font-mono text-sm text-slate-700">{submissionId}</code>
        </div>

        <p className="text-sm text-slate-400">You may close this window.</p>
      </div>
    </div>
  );
}

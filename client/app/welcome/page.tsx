import Link from "next/link";
import { CheckCircle } from "lucide-react";

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white px-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-black tracking-tight text-white">Welcome!</h1>
        <p className="text-slate-400 font-medium">
          Your subscription was successful. Thank you for choosing DevinBook!
        </p>
        <div className="pt-4">
          <Link 
            href="/settings"
            className="inline-flex items-center justify-center w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

import {
  Github,
  Bot,
  Code,
  GitMerge,
  ArrowRight,
  Terminal,
  Workflow,
  ShieldCheck,
  Cpu,
  AlertCircle,
  Gamepad
} from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '../components/theme-toggle';

export default function Home() {
  return (
    <div className="min-h-screen pb-20">
      <div className="fixed top-6 right-6 z-50 flex items-center gap-4">
        <Link
          href="https://github.com/jjgroenendijk/test-repo"
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer text-gray-700 dark:text-gray-200"
          aria-label="View source on GitHub"
        >
          <Github className="h-5 w-5" />
        </Link>
        <ThemeToggle />
      </div>

      {/* Mesh Gradient Background */}
      <div className="mesh-bg" />

      {/* Floating Shapes */}
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-purple-400/30 rounded-full blur-[100px] animate-float" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-blue-400/30 rounded-full blur-[100px] animate-float" style={{ animationDelay: '-3s' }} />
      </div>

      <main className="container mx-auto px-6 pt-20 relative z-10">

        {/* Hero Section */}
        <section className="flex flex-col items-center text-center mb-32">
          <div className="glass px-4 py-2 rounded-full mb-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm font-medium text-gray-600">Autonomous Agent Active</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-bold mb-6 tracking-tight text-gray-900 dark:text-white">
            Jules <span className="text-gradient">Autonomy</span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mb-10 leading-relaxed">
            A self-healing, self-improving software engineering system powered by Google Jules and GitHub Actions.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="#adaptation" className="glass hover:bg-white/60 dark:hover:bg-white/10 text-gray-900 dark:text-white px-8 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2">
              Adapt to Your Repo <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/game" className="glass bg-green-500/10 hover:bg-green-500/20 dark:bg-green-500/20 dark:hover:bg-green-500/30 text-green-700 dark:text-green-400 px-8 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 border border-green-500/20">
              Play Demo <Gamepad className="w-5 h-5" />
            </Link>
            <Link href="#architecture" className="px-8 py-3 rounded-xl font-semibold text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
              View Architecture
            </Link>
          </div>
        </section>

        {/* System Overview */}
        <section id="architecture" className="mb-32">
          <h2 className="text-3xl font-bold mb-12 text-center text-gray-800 dark:text-gray-100">System Architecture</h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass-card">
              <div className="bg-blue-100/50 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Bot className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-white">Jules Bridge</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                A Python script (<code>jules.py</code>) that acts as the brain. It listens to GitHub events, maintains session context, and communicates with the Google Jules API to generate code and plans.
              </p>
            </div>

            <div className="glass-card">
              <div className="bg-purple-100/50 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Workflow className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-white">Event Workflows</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                GitHub Actions (<code>run-agent.yml</code>) trigger on <code>issues: opened</code> and comments. They boostrap the environment using <code>uv</code> and execute the bridge script.
              </p>
            </div>

            <div className="glass-card">
              <div className="bg-pink-100/50 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <GitMerge className="w-6 h-6 text-pink-600" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-white">Auto-Merge & Repair</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                Trusted PRs are automatically merged via <code>manage-pr-lifecycle.yml</code>. If a conflict occurs, the system self-reports by opening a new issue to request Jules&apos; help.
              </p>
            </div>
          </div>

          {/* Flow Diagram Representation */}
          <div className="mt-16 glass p-8 rounded-2xl hidden md:block">
            <div className="flex justify-between items-center text-center">
              <div className="flex flex-col items-center gap-2">
                <div className="p-4 bg-white/40 dark:bg-white/10 rounded-xl"><Github className="w-8 h-8 text-gray-700 dark:text-gray-300"/></div>
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Issue Opened</span>
              </div>
              <ArrowRight className="w-6 h-6 text-gray-400" />
              <div className="flex flex-col items-center gap-2">
                <div className="p-4 bg-blue-100/40 dark:bg-blue-900/40 rounded-xl"><Workflow className="w-8 h-8 text-blue-600 dark:text-blue-400"/></div>
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Action Triggered</span>
              </div>
              <ArrowRight className="w-6 h-6 text-gray-400" />
              <div className="flex flex-col items-center gap-2">
                <div className="p-4 bg-purple-100/40 dark:bg-purple-900/40 rounded-xl"><Cpu className="w-8 h-8 text-purple-600 dark:text-purple-400"/></div>
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Jules API</span>
              </div>
              <ArrowRight className="w-6 h-6 text-gray-400" />
              <div className="flex flex-col items-center gap-2">
                <div className="p-4 bg-green-100/40 dark:bg-green-900/40 rounded-xl"><Code className="w-8 h-8 text-green-600 dark:text-green-400"/></div>
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">PR Created</span>
              </div>
              <ArrowRight className="w-6 h-6 text-gray-400" />
              <div className="flex flex-col items-center gap-2">
                <div className="p-4 bg-pink-100/40 dark:bg-pink-900/40 rounded-xl"><ShieldCheck className="w-8 h-8 text-pink-600 dark:text-pink-400"/></div>
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Auto Merge</span>
              </div>
            </div>
          </div>
        </section>

        {/* Adaptation Guide */}
        <section id="adaptation" className="max-w-4xl mx-auto">
          <div className="glass-card">
            <h2 className="text-3xl font-bold mb-8 text-gray-800 dark:text-white flex items-center gap-3">
              <Terminal className="w-8 h-8 text-gray-700 dark:text-gray-300" />
              Adaptation Guide
            </h2>

            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="flex-none w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold dark:bg-white dark:text-black">1</div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Copy Core Files</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-3 break-words">Copy the following files to your repository:</p>
                  <ul className="bg-white/30 dark:bg-white/5 p-4 rounded-xl font-mono text-sm text-gray-700 dark:text-gray-300 space-y-2 break-all w-full overflow-hidden">
                    <li>jules.py</li>
                    <li>setup.sh</li>
                    <li>pyproject.toml</li>
                    <li>uv.lock</li>
                    <li>.github/workflows/run-agent.yml</li>
                    <li>.github/workflows/manage-pr-lifecycle.yml</li>
                    <li>.github/workflows/report-ci-failure.yml</li>
                    <li>.github/workflows/detect-merge-conflicts.yml</li>
                    <li>.github/scripts/extract_log.py</li>
                    <li>.github/scripts/detect_merge_conflicts.py</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-none w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold dark:bg-white dark:text-black">2</div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Configure Secrets</h3>
                  <p className="text-gray-600 dark:text-gray-300 break-words">
                    Add the <code className="bg-white/50 dark:bg-white/10 px-2 py-1 rounded border border-gray-200 dark:border-gray-700">GOOGLE_JULES_API</code> secret to your GitHub repository settings. This key authenticates requests to the Jules backend.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-none w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold dark:bg-white dark:text-black">3</div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Configure Permissions</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-2 break-words">
                    Ensure your repository allows GitHub Actions to create Pull Requests and Issues.
                  </p>
                  <div className="glass p-4 rounded-xl flex gap-3 items-start">
                    <div className="p-2 bg-white/50 dark:bg-white/10 rounded-lg shrink-0">
                      <AlertCircle className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-300 pt-1">
                      <strong>Note:</strong> Go to Settings &gt; Actions &gt; General &gt; Workflow permissions and select &quot;Read and write permissions&quot;.
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-none w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold dark:bg-white dark:text-black">4</div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Connect to Jules Source</h3>
                  <p className="text-gray-600 dark:text-gray-300 break-words">
                    Install the Jules GitHub App on your repository so the API can discover the &quot;Source&quot; (your codebase) and index it.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="mt-32 text-center text-gray-500 text-sm">
          <p>Powered by Google Jules & Next.js</p>
        </footer>
      </main>
    </div>
  );
}

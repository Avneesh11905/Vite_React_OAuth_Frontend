import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    context: {
      auth: undefined!, // injected by the root or entrypoint
    },
    defaultNotFoundComponent: () => {
      return (
        <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-4 text-center bg-slate-50">
          <h1 className="text-6xl font-bold text-slate-900 drop-shadow-sm">404</h1>
          <p className="mt-4 text-xl text-slate-600">We couldn't find the page you were looking for.</p>
          <a href="/" className="mt-8 rounded-lg bg-indigo-600 px-6 py-2.5 font-medium text-white hover:bg-indigo-700 transition-colors shadow-sm">
            Return to Safety
          </a>
        </div>
      )
    },
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}

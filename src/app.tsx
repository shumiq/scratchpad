import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import Nav from "~/components/Nav";
import "./app.css";

export default function App() {
  return (
    <Router
      root={(props) => (
        <div class="flex h-full flex-col overflow-hidden">
          <Nav />
          <div class="min-h-0 flex-1 overflow-auto">
            <Suspense fallback={<div class="h-full" aria-hidden="true" />}>
              {props.children}
            </Suspense>
          </div>
        </div>
      )}
    >
      <FileRoutes />
    </Router>
  );
}

import { render } from "solid-js/web";
import { Router, Route } from "@solidjs/router";
import { MetaProvider } from "@solidjs/meta";

import Index from "./routes";
import Spell from "./routes/spell";

render(
  () => (
    <MetaProvider>
      <Router>
        <Route path="/" component={Index} />
        <Route path="/spell" component={Spell} />
       </Router>
    </MetaProvider>
  ),
  document.getElementById("root")!
);
import { render } from "solid-js/web";
import "./index.css";
import Chat from "./Chat.tsx";

const root = document.createElement("div");
root.id = "void";
document.body.append(root);

render(() => <Chat />, root!);

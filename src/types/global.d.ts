/// <reference types="@react-three/fiber" />
declare module "*.css";
declare module "*.scss";
declare module "*.png";
declare module "*.jpg";
declare module "*.svg";
declare module "*.jpeg";
declare module "*.gif";
declare module 'three/examples/jsm/loaders/MMDLoader';

interface UiState {
    mode: "home" | "session" | "loading";
    sessionId: string | null;
    sideIsOpened: boolean;
}

interface session {
   title: string;
   sessionId: string; 
}

interface message {
    role: "user" | "assistant" | "system";
    parts: Array<{ text: string }>;
}
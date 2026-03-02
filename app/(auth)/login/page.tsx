import { Suspense } from "react";
import { AuthLoginPage } from "./AuthLoginPage";

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <AuthLoginPage />
    </Suspense>
  );
}


import type { ReactNode } from "react";

type SubjectLayoutProps = {
  children: ReactNode;
};

export default function SubjectLayout({ children }: SubjectLayoutProps) {
  return <>{children}</>;
}

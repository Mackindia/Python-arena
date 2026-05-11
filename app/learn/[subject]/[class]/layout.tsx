import type { ReactNode } from "react";

type ClassLayoutProps = {
  children: ReactNode;
};

export default function ClassLayout({ children }: ClassLayoutProps) {
  return <>{children}</>;
}

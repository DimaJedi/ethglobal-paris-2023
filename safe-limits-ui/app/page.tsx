"use client";
import styles from "./page.module.css";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Safes from "@/components/Safes";
import Trade from "@/components/Trade";

export default function Home() {
  return (
    <main className={styles.main}>
        <ConnectButton />
        <Safes />
        <Trade />
    </main>
  );
}

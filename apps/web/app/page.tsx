import Capabilities from "../components/landing/Capabilities";
import CommandPalette from "../components/landing/CommandPalette";
import FinalCTA from "../components/landing/FinalCTA";
import FloatingKnowledge from "../components/landing/FloatingKnowledge";
import Footer from "../components/landing/Footer";
import GraphShowcase from "../components/landing/GraphShowcase";
import Hero from "../components/landing/Hero";
import InteractiveEditor from "../components/landing/InteractiveEditor";
import KnowledgeCounter from "../components/landing/KnowledgeCounter";
import Navbar from "../components/landing/Navbar";
import ScrollStory from "../components/landing/ScrollStory";
import Shortcuts from "../components/landing/Shortcuts";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <InteractiveEditor />
        <ScrollStory />
        <FloatingKnowledge />
        <CommandPalette />
        <GraphShowcase />
        <Capabilities />
        <Shortcuts />
        <KnowledgeCounter />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}

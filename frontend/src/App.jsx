import AnimatedCard from './components/common/AnimatedCard.jsx'

function App() {
  return (
    <main className="min-h-screen bg-creamIvory px-6 py-16 text-slateNavy">
      <AnimatedCard className="mx-auto max-w-3xl text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-royalMaroon">
          The Royal Knot
        </p>
        <h1 className="font-serif text-4xl text-royalMaroonDark">
          Wedding management, thoughtfully coordinated.
        </h1>
      </AnimatedCard>
    </main>
  )
}

export default App

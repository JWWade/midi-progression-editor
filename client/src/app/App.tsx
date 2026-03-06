import { ChromaticCircle } from '../features/chromatic-circle';

export default function App() {
  return (
    <main style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', padding: '2rem 1rem', boxSizing: 'border-box' }}>
      <h1>Hello World</h1>
      <ChromaticCircle />
    </main>
  );
}

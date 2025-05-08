import { useParams, Link } from "react-router-dom";

export default function RandomPage() {
  const { num } = useParams<{ num: string }>();

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-4xl font-bold mb-4">Random Number Route</h1>
      <p className="text-2xl mb-4">This page's random number: <span className="font-mono">{num}</span></p>
      <Link to="/" className="text-indigo-400 underline">Back to Home</Link>
      <Link to="/hello" className="text-indigo-400 underline">
        Go to Hello World
      </Link>
      <Link
        to={`/random/${Math.floor(Math.random() * 1000000)}`}
        className="text-indigo-400 underline"
      >
        Go to Random Route
      </Link>
    </div>
  );
} 
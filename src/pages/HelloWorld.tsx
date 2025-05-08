import { Link } from "react-router-dom";

export default function HelloWorld() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-4xl font-bold mb-4">Hello World</h1>
      <Link to="/" className="text-indigo-400 underline">
        Back to Home
      </Link>
    </div>
  );
} 
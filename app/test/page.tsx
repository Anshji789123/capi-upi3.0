export default function TestPage() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">🎉 App is Working!</h1>
        <p className="text-xl text-gray-400">CAPI Dashboard Test Page</p>
        <div className="mt-8 p-4 bg-gray-800 rounded-lg">
          <p className="text-green-400">✅ Next.js: Working</p>
          <p className="text-green-400">✅ Tailwind CSS: Working</p>
          <p className="text-green-400">✅ TypeScript: Working</p>
          <p className="text-yellow-400">⚠️ Firebase: Needs debugging</p>
        </div>
      </div>
    </div>
  )
}

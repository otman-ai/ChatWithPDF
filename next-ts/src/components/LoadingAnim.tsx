const LoadingAnim = () => {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="animate-pulse bg-gray-800 h-8 w-64 mx-auto mb-4 rounded"></div>
          <div className="animate-pulse bg-gray-800 h-4 w-96 mx-auto rounded"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse bg-gray-800 h-96 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }
export default LoadingAnim;
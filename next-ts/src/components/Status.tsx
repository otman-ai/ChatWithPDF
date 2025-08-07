interface MessageStatus {
  message: string;
  setErrors: React.Dispatch<React.SetStateAction<string | null>>;
}

export default function Errors({ message, setErrors }: MessageStatus) {
  return (
    <div className="absolute z-50 bottom-4 right-2">
      <div className="relative px-4  py-2 bg-red-500 text-white  rounded-lg flex justify-between items-center">
        <p>{message}</p>
        <button onClick={() => setErrors(null)} className={`p-1 rounded-lg`}>
          &times;
        </button>
      </div>
    </div>
  );
}

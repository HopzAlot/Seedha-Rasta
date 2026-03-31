export default function RouteControls({
  setSelectMode,
}: any) {
  return (
    <div className="flex gap-2">
      <button onClick={() => setSelectMode("source")} className="btn">
        Set Source
      </button>
      <button onClick={() => setSelectMode("dest")} className="btn">
        Set Destination
      </button>
    </div>
  );
}
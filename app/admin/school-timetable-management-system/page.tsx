export default function SchoolTimetableManagementSystem() {
  const timetableUrl = `/timetable/index.html?v=${new Date().getTime()}`;

  return (
    <div className="w-full h-screen bg-white">
      <iframe
        src={timetableUrl}
        className="w-full h-full border-0"
      />
    </div>
  );
}

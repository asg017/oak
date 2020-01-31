export function bytesToSize(bytes) {
  var sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes == 0) return "- B";
  var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  if (i == 0) return bytes + " " + sizes[i];
  return (bytes / Math.pow(1024, i)).toFixed(1) + " " + sizes[i];
}

export function duration(referenceDate, fromDate) {
  if (!fromDate) fromDate = new Date();
  const ms = fromDate.getTime() - referenceDate.getTime();
  if (ms < 1000) return `just now`;
  const numSeconds = Math.floor(ms / 1000);
  if (numSeconds < 60) {
    return `${numSeconds} second${numSeconds <= 1 ? "" : "s"} ago`;
  }
  const numMinutes = Math.floor(numSeconds / 60);
  if (numMinutes < 60) {
    return `${numMinutes} minute${numMinutes <= 1 ? "" : "s"} ago`;
  }
  const numHours = Math.floor(numMinutes / 60);
  if (numHours < 24) {
    return `${numHours} hour${numHours <= 1 ? "" : "s"} ago`;
  }
  const numDays = Math.floor(numHours / 24);
  return `${numDays} day${numDays <= 1 ? "" : "s"} ago`;
}

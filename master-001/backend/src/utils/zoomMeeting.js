import axios from "axios";
import { getZoomAccessToken } from "../config/zoom.config.js";

export async function createZoomMeeting(
  topic,
  startTime,
  durationMinutes = 60,
  timezone = "Asia/Kolkata"
) {
  const accessToken = await getZoomAccessToken();

  const response = await axios.post(
    "https://api.zoom.us/v2/users/me/meetings",
    {
      topic,
      type: 2,
      start_time: startTime,
      duration: durationMinutes,
      timezone,
      settings: {
        join_before_host: false,
        waiting_room: true,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data.join_url;
}

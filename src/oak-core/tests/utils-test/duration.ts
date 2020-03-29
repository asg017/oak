import test from "tape";
import { duration } from "../../src/utils";

test("utils-duration", async t => {
  const d0 = new Date(2020, 0, 1, 0, 0, 0);
  t.equal(duration(d0, new Date(2020, 0, 1, 0, 0, 0, 1)), "just now");
  t.equal(duration(d0, new Date(2020, 0, 1, 0, 0, 0, 999)), "just now");
  t.equal(duration(d0, new Date(2020, 0, 1, 0, 0, 1, 0)), "1 second ago");
  t.equal(duration(d0, new Date(2020, 0, 1, 0, 0, 2, 0)), "2 seconds ago");
  t.equal(duration(d0, new Date(2020, 0, 1, 0, 0, 2, 500)), "2 seconds ago");
  t.equal(duration(d0, new Date(2020, 0, 1, 0, 1, 0, 0)), "1 minute ago");
  t.equal(duration(d0, new Date(2020, 0, 1, 0, 30, 0, 0)), "30 minutes ago");
  t.equal(duration(d0, new Date(2020, 0, 1, 1, 0, 0, 0)), "1 hour ago");
  t.equal(duration(d0, new Date(2020, 0, 1, 23, 0, 0, 0)), "23 hours ago");
  t.equal(duration(d0, new Date(2020, 0, 2, 0, 0, 0, 0)), "1 day ago");
  t.equal(duration(d0, new Date(2020, 1, 2, 0, 0, 0, 0)), "32 days ago");
  t.end();
});

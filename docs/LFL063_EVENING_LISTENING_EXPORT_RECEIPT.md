# LFL-063 evening listening export receipt

Status: source-complete

The requested 12-participant export was generated read-only from the PCT128
production PostgreSQL database after the deployment health checks. It includes
assignment settings, every diagnostic attempt (including in-progress and
archived/retake lineages), stored result data, append-only answer/audio/section
events, and per-attempt counts such as answers by section, audio events by
question, and the latest recorded audio position.

Local artifact: `/home/miko/Downloads/reHEARse-evening-listening-2026-11-11.json`
(mode `600`, schema `lfl063.evening-listening-export.v1`). It is intentionally
outside Git and contains private learner data. The requested Muhammad Yonifan
and Farhan accounts were included through explicit alias matches found in the
database; the requested Tiara account was recorded as not found with no
attempts. No password hashes, session tokens, or source answer keys were
exported.

The export is evidence of server-observed events and timestamps, not a claim
about actual audio audibility or cognitive reaction time.

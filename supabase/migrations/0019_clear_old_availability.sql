begin;

-- This migration clears out all old availability data.
-- This is necessary to remove recurring slots that were created before
-- the 'specific_date' logic was implemented, which caused them to
-- appear every week instead of on a single date.
-- After running this, providers will need to re-add their availability.

delete from public.provider_availability;

commit;

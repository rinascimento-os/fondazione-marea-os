-- Public Stats RPC Function
-- Returns aggregated, anonymized data for the public showcase page (vetrina).
-- Uses SECURITY DEFINER to bypass RLS, and grants access to the anon role.
--
-- Run this in the Supabase SQL Editor to enable the public dashboard.

CREATE OR REPLACE FUNCTION get_public_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'total_pionieri', (SELECT count(*) FROM pionieri),
    'total_hours', (SELECT coalesce(sum(hours), 0) FROM time_entries),
    'active_projects', (SELECT count(*) FROM projects WHERE status = 'active'),
    'total_matches', (
      SELECT count(*) FROM matches
      WHERE status IN ('confirmed', 'active', 'completed')
    ),
    'skills_by_category', (
      SELECT coalesce(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT s.category, count(DISTINCT ps.pioniere_id) as pionieri_count
        FROM skills s
        JOIN pioniere_skills ps ON ps.skill_id = s.id
        WHERE s.category IS NOT NULL
        GROUP BY s.category
        ORDER BY pionieri_count DESC
      ) t
    ),
    'top_skills', (
      SELECT coalesce(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT s.name, s.category, count(*) as count
        FROM pioniere_skills ps
        JOIN skills s ON s.id = ps.skill_id
        GROUP BY s.name, s.category
        ORDER BY count DESC
        LIMIT 15
      ) t
    ),
    'hours_by_month', (
      SELECT coalesce(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT to_char(date, 'YYYY-MM') as month, sum(hours) as hours
        FROM time_entries
        WHERE date >= (now() - interval '12 months')
        GROUP BY to_char(date, 'YYYY-MM')
        ORDER BY month
      ) t
    ),
    'locations', (
      SELECT coalesce(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT location, count(*) as count
        FROM pionieri
        WHERE location IS NOT NULL AND trim(location) != ''
        GROUP BY location
        ORDER BY count DESC
        LIMIT 15
      ) t
    ),
    'projects_by_type', (
      SELECT coalesce(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT
          type,
          count(*) as count,
          count(*) FILTER (WHERE status = 'active') as active_count
        FROM projects
        GROUP BY type
      ) t
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- Allow the anonymous (public) role to call this function
GRANT EXECUTE ON FUNCTION get_public_stats() TO anon;
GRANT EXECUTE ON FUNCTION get_public_stats() TO authenticated;

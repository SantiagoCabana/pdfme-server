CREATE UNIQUE INDEX template_version_one_current_per_template
ON template_version (template_id)
WHERE is_current = true;

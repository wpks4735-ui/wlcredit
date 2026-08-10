-- WL Credit V25.8.2 - allow customer video uploads
update storage.buckets
set allowed_mime_types = array['image/jpeg','image/png','image/webp','application/pdf','video/mp4','video/quicktime','video/webm'],
    file_size_limit = greatest(coalesce(file_size_limit,0), 52428800)
where id = 'customer-documents';

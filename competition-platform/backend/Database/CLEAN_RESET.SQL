-- Delete the specific registration to start fresh
DELETE FROM registrations 
WHERE 
    user_id IN (SELECT id FROM users WHERE email = 'student@example.com') 
    AND 
    competition_id IN (SELECT id FROM competitions WHERE title ILIKE '%TN-IMPACT%');


SELECT properties.*, AVG(rating) AS average_rating
FROM properties
JOIN property_reviews ON properties.id = property_id
WHERE city LIKE '%ancouv%'
GROUP BY properties.id, title, cost_per_night
HAVING AVG(rating) >= 4
ORDER BY cost_per_night
LIMIT 10;
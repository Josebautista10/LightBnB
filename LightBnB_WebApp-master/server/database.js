const properties = require('./json/properties.json');
const { Pool } = require('pg');

const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */

const getUserWithEmail = function (email) {
  return pool
    .query(
      `SELECT *
    FROM users
    WHERE email = $1`,
      [email]
    )
    .then((res) => {
      return res.rows[0];
    });
};
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */

const getUserWithId = function (id) {
  return pool
    .query(`SELECT * FROM users WHERE id = $1;`, [id])
    .then((res) => (res.rows.length > 0 ? res.rows[0] : null))
    .catch((err) => err.message);
};
exports.getUserWithId = getUserWithId;

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */

const addUser = function (user) {
  const values = [`${user.name}`, `${user.email}`, `password`];

  return pool
    .query(
      `
      INSERT INTO users (name, email, password)
      VALUES ($1, $2, $3)
      RETURNING *;
      `,
      values
    )
    .then((res) => res.rows[0])
    .catch((err) => err.message);
};
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
// eslint-disable-next-line camelcase
const getAllReservations = function (guest_id, limit = 10) {
  return pool
    .query(
      `SELECT reservations.*, properties.*, ROUND(AVG(rating)) as average_rating
  FROM reservations
  JOIN properties ON properties.id = reservations.property_id
  JOIN property_reviews ON property_reviews.property_id = properties.id
  WHERE reservations.guest_id = $1
  GROUP BY reservations.id, properties.id
  ORDER BY reservations.start_date
  LIMIT $2`,
      // eslint-disable-next-line camelcase
      [guest_id, limit]
    )
    .then((res) => {
      return res.rows;
    });
};
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function (options, limit = 10) {
  const queryParams = [];
  let queryString = `
    SELECT properties.*, avg(rating) as average_rating
    FROM properties
    JOIN property_reviews ON property_reviews.property_id = properties.id
  `;

  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `WHERE city LIKE $${queryParams.length} `;
  }

  if (options.owner_id) {
    queryString += queryParams.length === 0 ? `WHERE ` : `AND `;
    queryParams.push(parseInt(options.owner_id));
    queryString += `properties.owner_id = $${queryParams.length} `;
  }

  if (options.minimum_price_per_night) {
    queryString += queryParams.length === 0 ? `WHERE ` : `AND `;
    queryParams.push(parseInt(options.minimum_price_per_night));
    queryString += `properties.cost_per_night > $${queryParams.length} `;
  }

  if (options.maximum_price_per_night) {
    queryString += queryParams.length === 0 ? `WHERE ` : `AND `;
    queryParams.push(parseInt(options.maximum_price_per_night));
    queryString += `properties.cost_per_night < $${queryParams.length} `;
  }

  queryString += `GROUP BY properties.id `;
  if (options.minimum_rating) {
    queryParams.push(parseInt(options.minimum_rating));
    queryString += `HAVING avg(rating) >= $${queryParams.length} `;
  }
  queryParams.push(limit);
  queryString += `ORDER BY cost_per_night
  LIMIT $${queryParams.length};
`;

  return pool
    .query(queryString, queryParams)
    .then((res) => res.rows)
    .catch((err) => err.stack);
};
exports.getAllProperties = getAllProperties;

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function (property) {
  const queryParams = [
    property.owner_id,
    property.title,
    property.description,
    property.thumbnail_photo_url,
    property.cover_photo_url,
    property.cost_per_night,
    property.street,
    property.city,
    property.province,
    property.post_code,
    property.country,
    property.parking_spaces,
    property.number_of_bathrooms,
    property.number_of_bedrooms
  ];

  const queryString = `
  INSERT INTO properties (owner_id, title, description,
    thumbnail_photo_url, cover_photo_url, cost_per_night,
    street, city, province, post_code, country, parking_spaces,
    number_of_bathrooms, number_of_bedrooms)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
  RETURNING *;
`;

  return pool
    .query(queryString, queryParams)
    .then((res) => res.rows[0])
    .catch((err) => console.log(err.stack));
};
exports.addProperty = addProperty;

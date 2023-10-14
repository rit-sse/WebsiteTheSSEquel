-- This file serves as reference material of our backend schema in which schema.prisma will model after.

DROP TABLE IF EXISTS site_user, quote, officer_position, officer, skill, mentor_skill, mentor, hour_block, schedule, department, course, course_taken;

CREATE TABLE site_user(
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(40) NOT NULL,
    last_name VARCHAR(40) NOT NULL,
    email VARCHAR(40) NOT NULL,
    is_member BOOLEAN DEFAULT FALSE,
    profile_pic VARCHAR(40),
    github VARCHAR(100),
    linkedin VARCHAR(100),
    deactivation_date DATE
);

CREATE TABLE quote(
    id SERIAL PRIMARY KEY,
    date_added DATE NOT NULL,
    quote VARCHAR(255) NOT NULL,
    user_id INTEGER REFERENCES site_user(id),
    author VARCHAR(40) NOT NULL
);

CREATE TABLE officer_position(
    id SERIAL PRIMARY KEY,
    title VARCHAR(40) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    email VARCHAR(40) NOT NULL
);

CREATE TABLE officer(
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES site_user(id) NOT NULL,
    position_id INTEGER REFERENCES officer_position(id) NOT NULL,
    is_active BOOLEAN NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL
);

CREATE TABLE skill(
    id SERIAL PRIMARY KEY,
    skill VARCHAR(40) NOT NULL
);

CREATE TABLE mentor_skill(
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES site_user(id) NOT NULL,
    skill_id INTEGER REFERENCES skill(id) NOT NULL
);

CREATE TABLE mentor(
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES site_user(id) NOT NULL,
    start_date DATE,
    expiration_date DATE,
    is_active BOOLEAN NOT NULL
);

CREATE TABLE hour_block(
    id SERIAL PRIMARY KEY,
    weekday VARCHAR(10) NOT NULL,
    start_time INTEGER NOT NULL,
    end_time TIME NOT NULL
);

CREATE TABLE schedule(
    id SERIAL PRIMARY KEY,
    mentor_id INTEGER REFERENCES mentor(id) NOT NULL,
    hour_block_id INTEGER REFERENCES hour_block(id) NOT NULL
);

CREATE TABLE department(
    id SERIAL PRIMARY KEY,
    title VARCHAR(40)
);

CREATE TABLE course(
    id SERIAL PRIMARY KEY,
    title VARCHAR(40) NOT NULL,
    department_id INTEGER REFERENCES department(id) NOT NULL,
    code INTEGER NOT NULL
);

CREATE TABLE course_taken(
    id SERIAL PRIMARY KEY,
    mentor_id INTEGER REFERENCES mentor(id) NOT NULL,
    course_id INTEGER REFERENCES course(id) NOT NULL
);
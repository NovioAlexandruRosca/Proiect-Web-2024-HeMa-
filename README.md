# Project Title: <img src="images/website_Icon/plant.png" alt="Logo" width="35" style="margin-top: 10px;">HeMa (Herbal Web Manager)

## Creation Interval.
March 25, 2024 - Present

## Description
This project aims to develop a Digital Herbarium web application, providing support for organizing collections of graphical representations of pressed plants and their associated attributes. Leveraging multi-criteria search capabilities, the application will generate, recommend, and share thematic albums such as medicinal plants, mountain flowers, and more. For relevant photographs, public APIs like Unsplash will be considered.
Various statistics will be generated and made available in open formats, including minimal, CSV, and PDF. Additionally, a ranking of the most popular collected plants will be created, also available as an RSS feed.

## Features
- Organize Collections: Users can organize their collections of pressed plants with associated attributes
- Multi-criteria Search: Advanced search functionalities enable users to find specific plants based on various criteria
- Thematic Albums: The application generates, recommends, and shares thematic albums based on user preferences
- Photograph Integration: Integration with public APIs like Unsplash to fetch relevant photographs of plants
- Statistical Analysis: Various statistics are generated and presented in open formats, aiding in data analysis and visualization
- Popular Plant Ranking: Creation of a ranking system to showcase the most popularly collected plants
- RSS Feed: Availability of a RSS feed for users to stay updated with the latest plant collections and rankings
- Data visualization: Different atributes of a user can be exported as csv/pdf files

### Technologies Used
- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, ...
- Database: MySql
- External APIs: Unsplash API
- Libraries: [See Dependencies](#dependencies)

## [Used Pallet](https://colorhunt.co/palette/49698958a399a8cd9fe2f4c5)

## Getting Started
1. Clone the repository
2. Install dependencies using npm install
3. Set up MySQL database and configure database connection
4. Obtain API key from Unsplash (if required) and configure
5. Start the application using npm start(this will start the rss generator as well)

## <a name="dependencies"></a>Dependencies  
- **node-cron** (Version 3.0.3)
- **rss-generator** (Version 0.0.3)
- **dotenv** (Version 16.4.5)
- **nodemon** (Version 3.1.0)
- **nodemailer** (Version 6.9.13)
- **mysql2** (Version 3.9.3)
- **bcrypt** (Version 5.1.1)

## Contribution
- You are welcome to create pull requests in order to report bugs or suggest further improvments of the app

## Database(This is only for educational purposes)

- The tables from the database are as it follows:

CREATE TABLE clients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE SentEmails (
    id INT AUTO_INCREMENT PRIMARY KEY,
    account_email VARCHAR(255) NOT NULL,
    sender_name VARCHAR(255) NOT NULL,
    sender_email VARCHAR(255) NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE blog_posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    post_date DATE NOT NULL,
    user_id INT NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES clients(id) ON DELETE CASCADE
);

CREATE TABLE blog_post_sections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE
);

CREATE TABLE section_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    section_id INT NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES blog_post_sections(id) ON DELETE CASCADE
);

CREATE TABLE comments (
    id INT NOT NULL AUTO_INCREMENT,
    post_id INT,
    user_id INT,
    user_name VARCHAR(255),
    comment_text TEXT,
    posted_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY post_id_fk (post_id),
    CONSTRAINT post_id_fk FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE,
    CONSTRAINT user_id_fk FOREIGN KEY (user_id) REFERENCES clients(id) ON DELETE CASCADE
);

CREATE TABLE clients_details (
    client_id INT PRIMARY KEY,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    name VARCHAR(255),
    occupation VARCHAR(255),
    city VARCHAR(255),
    street VARCHAR(255),
    house_number VARCHAR(50),
    facebook_link VARCHAR(255),
    github_link VARCHAR(255),
    instagram_link VARCHAR(255),
    twitter_link VARCHAR(255)
);

CREATE TABLE plants (
    plant_id INT NOT NULL AUTO_INCREMENT,
    owner_id INT NOT NULL,
    collection_id INT NOT NULL,
    collection_date DATE,
    hashtags VARCHAR(255),
    common_name VARCHAR(255),
    scientific_name VARCHAR(255),
    family VARCHAR(255),
    genus VARCHAR(255),
    species VARCHAR(255),
    place_of_collection VARCHAR(255),
    color VARCHAR(255),
    PRIMARY KEY (plant_id),
    FOREIGN KEY (owner_id)
        REFERENCES clients(id)
        ON DELETE CASCADE,
    FOREIGN KEY (collection_id)
        REFERENCES plant_collections(collection_id)
        ON DELETE CASCADE
);

CREATE TABLE plant_collections (
    collection_id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    name VARCHAR(255),
    description TEXT,
    is_shared BOOLEAN DEFAULT FALSE,
    creation_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modification_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id)
);

CREATE TABLE badges (
    client_id INT NOT NULL,
    badge1 VARCHAR(255) DEFAULT NULL,
    badge2 VARCHAR(255) DEFAULT NULL,
    badge3 VARCHAR(255) DEFAULT NULL,
    badge4 VARCHAR(255) DEFAULT NULL,
    badge5 VARCHAR(255) DEFAULT NULL,
    PRIMARY KEY (client_id),
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

CREATE TABLE followers (
    follower_id INT NOT NULL,
    followed_id INT NOT NULL,
    follow_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (follower_id, followed_id),
    FOREIGN KEY (follower_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (followed_id) REFERENCES clients(id) ON DELETE CASCADE
);

CREATE TABLE PasswordResetTokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

## Screenshots

> ⚠️ ***KEEP IN MIND THAT THE ENTIRE WEBSITE IS RESPONSIVE, BUT TOO MANY SCREENSHOTS ARE NEEDED TO REPRESENT IT***

Here you can see a couple of screenshots of the app in use:

- **Landing Page**
![landing](https://github.com/NovioAlexandruRosca/Proiect-Web-2024-HeMa-/assets/113398639/0eec0c83-96f8-4aa2-addf-2f79b859436d)

- **Login Page**
![login](https://github.com/NovioAlexandruRosca/Proiect-Web-2024-HeMa-/assets/113398639/4b426f0c-6425-4765-a787-5522a0fd0bf0)

- **Register Page**
![register](https://github.com/NovioAlexandruRosca/Proiect-Web-2024-HeMa-/assets/113398639/ed35cc4f-5e9f-4086-a960-7b1690c8334d)

- **Admin Page**
![admin](https://github.com/NovioAlexandruRosca/Proiect-Web-2024-HeMa-/assets/113398639/90631d86-fdd7-42f5-9bd9-495d25bee8d2)

- **List Of Users Page**
![listOfClients](https://github.com/NovioAlexandruRosca/Proiect-Web-2024-HeMa-/assets/113398639/9e8e46dc-007c-4676-974c-560991cb4e4a)

- **Generate Reports Page**
![generetateReports](https://github.com/NovioAlexandruRosca/Proiect-Web-2024-HeMa-/assets/113398639/1c18e8fb-6df6-42e6-a91b-75a7be77dfe8)

- **Error404 Page**
![error404](https://github.com/NovioAlexandruRosca/Proiect-Web-2024-HeMa-/assets/113398639/96924e32-c406-4076-a9c6-e5033dba6fc3)

- **Home Page(First Part)**
![home1](https://github.com/NovioAlexandruRosca/Proiect-Web-2024-HeMa-/assets/113398639/dfa2bc81-2283-4308-a303-657fb58261fb)
- **Home Page(Second Part)**
![home2](https://github.com/NovioAlexandruRosca/Proiect-Web-2024-HeMa-/assets/113398639/5d4beccc-f777-4899-97bb-3a09c38d27ee)

- **About Us Page**
![about](https://github.com/NovioAlexandruRosca/Proiect-Web-2024-HeMa-/assets/113398639/86174845-fbf9-482c-946a-aae20cc21502)

- **Forum Page(Text View)**
![sharedCol](https://github.com/NovioAlexandruRosca/Proiect-Web-2024-HeMa-/assets/113398639/0fca72fd-397b-43b2-9af6-34cc51fdcc2f)
- **Forum Page(Visual boxes)**
![sharedCol2](https://github.com/NovioAlexandruRosca/Proiect-Web-2024-HeMa-/assets/113398639/26566ea3-d9c9-46fa-9b6c-156ad963cc39)
- **Forum Page(Search Capabilities)**
![sharedCol3](https://github.com/NovioAlexandruRosca/Proiect-Web-2024-HeMa-/assets/113398639/c6ff682e-640c-408d-a2e5-551c8b82afa7)

- **Blogs Page**
![blogs](https://github.com/NovioAlexandruRosca/Proiect-Web-2024-HeMa-/assets/113398639/a3e9b475-6ae3-4def-9fed-fafa79ce297b)

- **Profile(Without Collections)**
![profile](https://github.com/NovioAlexandruRosca/Proiect-Web-2024-HeMa-/assets/113398639/9b3d524e-4da0-415a-8c0b-009f82e3e006)
- **Profile(With Collections)**
![profileWithCollections](https://github.com/NovioAlexandruRosca/Proiect-Web-2024-HeMa-/assets/113398639/0f71970d-8860-493e-97ce-c2cfe92774b9)

- **Collection**
![plantCollection](https://github.com/NovioAlexandruRosca/Proiect-Web-2024-HeMa-/assets/113398639/13cd3302-1da7-41d9-bb16-c2d097831a65)

- **Contact(UI)**
![contact1](https://github.com/NovioAlexandruRosca/Proiect-Web-2024-HeMa-/assets/113398639/662107cf-37ea-486f-813c-0abc3602fa9a)
- **Contact(Mail Sending Example)**
![contact2](https://github.com/NovioAlexandruRosca/Proiect-Web-2024-HeMa-/assets/113398639/b336a6cc-f6f0-4df4-8bd6-a1a04b5333be)

- **NavBar(Normal Size)**
![navbar](https://github.com/NovioAlexandruRosca/Proiect-Web-2024-HeMa-/assets/113398639/2fd5e5d3-7969-4d5f-8ab2-df2bf1d44cfd)
- **NavBar(Responsive Capabilities)**
![navbar2](https://github.com/NovioAlexandruRosca/Proiect-Web-2024-HeMa-/assets/113398639/35f75fd0-b6b7-4d06-a781-046da0422de5)
- **NavBar(Responsive Use Example)**
![navbar3](https://github.com/NovioAlexandruRosca/Proiect-Web-2024-HeMa-/assets/113398639/e2177a48-7963-4aca-9cb5-6c1c382b668c)




import asyncio
from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import Base, User, PickupLocation, TimeSlot, Post, Comment


def seed_database():
    """Seed the database with initial data"""
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    # Create a database session
    db = SessionLocal()
    
    try:
        # Check if data already exists
        if db.query(PickupLocation).first() is not None:
            print("Database already seeded. Skipping...")
            return
        
        # Create pickup locations
        locations = [
            PickupLocation(name="Mars", address="Main Mars Campus"),
            PickupLocation(name="Kappa Sigma", address="Kappa Sigma House"),
            PickupLocation(name="EVGR", address="Evergreen Building"),
        ]
        
        for location in locations:
            db.add(location)
        
        # Create time slots
        time_slots = [
            TimeSlot(time="11:30 AM - 12:00 PM"),
            TimeSlot(time="12:00 PM - 12:30 PM"),
            TimeSlot(time="12:30 PM - 1:00 PM"),
            TimeSlot(time="1:00 PM - 1:30 PM"),
        ]
        
        for slot in time_slots:
            db.add(slot)
        
        # Create sample users
        users = [
            User(
                name="Jamie Smith",
                email="jamie@example.com",
                image_url="https://source.unsplash.com/random/300x300/?portrait",
                pickup_location="Mars",
                time_slot="12:00 PM - 12:30 PM"
            ),
            User(
                name="Alex Johnson",
                email="alex@example.com",
                image_url="https://source.unsplash.com/random/300x300/?person",
                pickup_location="Kappa Sigma",
                time_slot="12:30 PM - 1:00 PM"
            ),
            User(
                name="Jordan Lee",
                email="jordan@example.com",
                image_url="https://source.unsplash.com/random/300x300/?face",
                pickup_location="EVGR",
                time_slot="1:00 PM - 1:30 PM"
            ),
            User(
                name="Admin User",
                email="admin@example.com",
                image_url="https://source.unsplash.com/random/300x300/?admin",
                pickup_location="Mars",
                time_slot="11:30 AM - 12:00 PM",
                is_admin=True
            )
        ]
        
        for user in users:
            db.add(user)
        
        # Commit users first to get their IDs
        db.commit()
        
        # Create sample posts
        posts = [
            Post(
                content="Hey everyone! Super excited for today's street meat gathering! 🌮",
                author_id=users[0].id,
                location_filter=None  # Global post
            ),
            Post(
                content="Anyone know what the special is today? Can't wait to try something new!",
                author_id=users[1].id,
                location_filter="Kappa Sigma"
            ),
            Post(
                content="This is my first time attending - what should I expect? Any recommendations?",
                author_id=users[2].id,
                location_filter=None
            ),
            Post(
                content="Weather looks great for eating outdoors today! Perfect timing 🌞",
                author_id=users[3].id,
                location_filter="Mars"
            )
        ]
        
        for post in posts:
            db.add(post)
        
        # Commit posts to get their IDs
        db.commit()
        
        # Create sample comments
        comments = [
            Comment(
                content="So excited! This is going to be amazing!",
                author_id=users[1].id,
                post_id=posts[0].id
            ),
            Comment(
                content="I heard there's going to be some amazing tacos!",
                author_id=users[2].id,
                post_id=posts[1].id
            ),
            Comment(
                content="Welcome! It's always a great time. Make sure to try the recommendations from the regulars!",
                author_id=users[0].id,
                post_id=posts[2].id
            ),
            Comment(
                content="Perfect weather indeed! See everyone there!",
                author_id=users[1].id,
                post_id=posts[3].id
            )
        ]
        
        for comment in comments:
            db.add(comment)
        
        # Add some likes to posts
        posts[0].liked_by.append(users[1])
        posts[0].liked_by.append(users[2])
        posts[1].liked_by.append(users[0])
        posts[2].liked_by.append(users[3])
        
        # Add some likes to comments
        comments[0].liked_by.append(users[0])
        comments[1].liked_by.append(users[1])
        
        db.commit()
        print("Database seeded successfully!")
        
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_database() 
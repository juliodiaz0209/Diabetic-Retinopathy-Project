import sqlite3
from sqlite3 import IntegrityError
import hashlib
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

 

# Hash Password.
def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()


# Create Database Connection.
def get_db_connection():
    connection = sqlite3.connect('medical_data.db')
    return connection


# Initialize database.
def init_db():
    connection = get_db_connection()
    with connection:
        connection.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY,
                username TEXT UNIQUE,
                name TEXT,
                hashed_password TEXT,
                email TEXT
            )
        ''')
        connection.commit()
        connection.execute('''
            CREATE TABLE IF NOT EXISTS patients (
                patient_id INTEGER PRIMARY KEY,
                username TEXT UNIQUE,
                name TEXT,
                age INTEGER,
                gender TEXT,
                contact_info TEXT
            )
        ''')
        connection.commit()
        connection.execute('''
            CREATE TABLE IF NOT EXISTS DR_Prediction (
                prediction_id INTEGER PRIMARY KEY,
                patient_id INTEGER,
                prediction_date TEXT,
                prediction_class TEXT,
                confidence_score REAL,
                FOREIGN KEY (patient_id) REFERENCES patients (patient_id)
            )
        ''')
        connection.commit()
    connection.close()


# Function to add a user to the database
def add_user(username, name, password, email):
    try:
        connection = get_db_connection()
        hashed_password = hash_password(password)
        
        with connection:
            connection.execute('INSERT INTO users (username, name, hashed_password, email) VALUES (?, ?, ?, ?)',
                               (username, name, hashed_password, email))
            connection.commit()  # Commit the transaction

    except IntegrityError:
        # Handle the case where the username already exists
        print(f"Error: Username '{username}' already exists in the database.")

    except Exception as e:
        # Handle other exceptions
        print(f"An error occurred: {str(e)}")

    finally:
        if connection:
            connection.close()


# Authenticate user.
def authenticate_user(username, password):
    connection = get_db_connection()
    hashed_password = hash_password(password)
    user = connection.execute('SELECT * FROM users WHERE username = ? AND hashed_password = ?', (username, hashed_password)).fetchone()
    connection.commit()
    connection.close()
    return user


# Add Patient Table.
def add_patient(user_name, name, age, gender, contact_info):
    connection = get_db_connection()
    with connection:
        connection.execute('INSERT INTO patients (username, name, age, gender, contact_info) VALUES (?, ?, ?, ?, ?)',
                     (user_name, name, age, gender, contact_info))
        connection.commit()
    connection.close()


# Add Prediction Table.
def add_dr_prediction(patient_id, prediction_class, confidence_score):
    connection = get_db_connection()
    prediction_date = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    with connection:
        connection.execute('INSERT INTO DR_Prediction (patient_id, prediction_date, prediction_class, confidence_score) VALUES (?, ?, ?, ?)',
                     (patient_id, prediction_date, prediction_class, confidence_score))
        connection.commit()
    connection.close()
   
   

# Function to get a patient's ID from the database.
def get_patient_id(username):
    connection = get_db_connection()
    cursor = connection.cursor()
    cursor.execute("SELECT patient_id FROM patients WHERE username = ?", (username,))
    data = cursor.fetchone()
    connection.close()
    if data:
        return data[0]  # Return the patient_id
    else:
        return None


         
    
# Function to get a patient's data from the database.
def get_patient_data(username):
    connection = get_db_connection()
    cursor = connection.cursor()
    cursor.execute("SELECT name, age, gender, contact_info FROM patients WHERE username = ?", (username,))
    data = cursor.fetchone()
    connection.close()
    
    if data:
        return {
            'name': data[0],
            'age': data[1],
            'gender': data[2],
            'contact': data[3]
        }
    else:
        return None


# Function to query and fetch data from the database, filtered by username
def fetch_predictions(username):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT p.name, d.patient_id, d.prediction_class, d.confidence_score, d.prediction_date FROM patients AS p INNER JOIN DR_Prediction AS d ON p.patient_id = d.patient_id WHERE p.username = ?", (username,))
    data = cursor.fetchall()
    conn.close()
    
    if data:
        return data
    
    else: 
        return None



# Function to generate PDF report
def generate_pdf_report(predictions):
    pdf_filename = f"predictions_report_{datetime.now().strftime('%Y-%m-%d_%H-%M-%S')}.pdf"
    c = canvas.Canvas(pdf_filename, pagesize=letter)
    
    # Set up PDF content
    c.setFont("Helvetica-Bold", 14)
    c.drawString(100, 750, "Predictions Overview")
    c.setFont("Helvetica", 12)
    y_position = 700
    
    # Write predictions to PDF
    for prediction in predictions:
        c.drawString(100, y_position, f"Name: {prediction[0]}")
        c.drawString(100, y_position - 20, f"Patient ID: {prediction[1]}")
        c.drawString(100, y_position - 40, f"Prediction Class: {prediction[2]}")
        c.drawString(100, y_position - 60, f"Confidence Score: {prediction[3]}")
        c.drawString(100, y_position - 80, f"Prediction Date: {prediction[4]}")
        y_position -= 100
    
    # Save PDF file
    c.save()
    return pdf_filename

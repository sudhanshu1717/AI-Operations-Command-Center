from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
from dotenv import load_dotenv
import os
import pandas as pd
from ortools.linear_solver import pywraplp
from fastapi.responses import FileResponse
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet

# Load environment variables
load_dotenv()

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-2.5-flash")

# Create FastAPI app
app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://ai-operations-command-center.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Query(BaseModel):
    question: str


@app.get("/")
def home():
    return {
        "message": "AI Operations Command Center Running"
    }


@app.post("/ask")
def ask_ai(query: Query):

    warehouse_df = pd.read_csv("../data/warehouse.csv")
    inventory_df = pd.read_csv("../data/inventory.csv")

    warehouse_info = warehouse_df.to_string(index=False)
    inventory_info = inventory_df.to_string(index=False)

    prompt = f"""
    You are an Operations Intelligence Assistant.

    Warehouse Data:
    {warehouse_info}

    Inventory Data:
    {inventory_info}

    User Question:
    {query.question}

    Based on the provided data:

    1. Analyze current operations
    2. Identify risks
    3. Recommend actions
    4. Give an executive summary

    Use actual numbers from the data.
    """
    try:

        response = model.generate_content(prompt)

        return {
            "answer": response.text
        }

    except Exception as e:

     if "429" in str(e):
        return {
            "answer":
            "AI service quota reached. Please try again later or use another API key."
        }

    return {
        "answer": f"ERROR: {str(e)}"
    }
@app.post("/optimize")
def optimize_inventory():

    warehouse_df = pd.read_csv("../data/warehouse.csv")

    solver = pywraplp.Solver.CreateSolver("GLOP")

    shift_to_b = solver.NumVar(0, 300, "shift_to_b")

    solver.Maximize(shift_to_b)

    solver.Add(600 + shift_to_b <= 1200)

    status = solver.Solve()

    if status == pywraplp.Solver.OPTIMAL:
        return {
            "recommendation":
                f"Move {shift_to_b.solution_value():.0f} units "
                f"from Warehouse C to Warehouse B",
            "benefit":
                "Reduces capacity risk and balances utilization"
        }

    return {"error": "Optimization failed"}


@app.post("/decision")
def decision_support():

    warehouse_df = pd.read_csv("../data/warehouse.csv")

    solver = pywraplp.Solver.CreateSolver("GLOP")

    shift_to_b = solver.NumVar(0, 300, "shift_to_b")

    solver.Maximize(shift_to_b)

    solver.Add(600 + shift_to_b <= 1200)

    status = solver.Solve()

    recommendation = ""

    if status == pywraplp.Solver.OPTIMAL:
        recommendation = (
            f"Move {shift_to_b.solution_value():.0f} units "
            f"from Warehouse C to Warehouse B"
        )

    prompt = f"""
    You are a Chief Operations Officer.

    Current warehouse data:

    {warehouse_df.to_string(index=False)}

    Optimization recommendation:

    {recommendation}

    Generate:

    1. Executive Summary
    2. Risk Assessment
    3. Business Impact
    4. Recommended Actions

    Keep it professional.
    """

    response = model.generate_content(prompt)

    return {
        "optimization": recommendation,
        "executive_report": response.text
    }

@app.get("/metrics")
def get_metrics():

    warehouse_df = pd.read_csv("../data/warehouse.csv")
    inventory_df = pd.read_csv("../data/inventory.csv")
    warehouse_df["utilization"] = (
        warehouse_df["current_stock"]
        / warehouse_df["capacity"]
        * 100
    )

    avg_utilization = round(
        warehouse_df["utilization"].mean(),
        2
    )

    max_utilization = round(
        warehouse_df["utilization"].max(),
        2
    )

    total_stock = int(
        warehouse_df["current_stock"].sum()
    )

    alerts = []

    for _, row in warehouse_df.iterrows():

        utilization = row["utilization"]

        if utilization > 90:
            alerts.append(
                f"⚠ Warehouse {row['warehouse']} utilization is {utilization:.2f}% (High Risk)"
            )

        elif utilization < 60:
            alerts.append(
                f"⚠ Warehouse {row['warehouse']} utilization is only {utilization:.2f}%"
            )

    for _, row in inventory_df.iterrows():

        days = row["stock"] / row["daily_demand"]

        if days < 12:
            alerts.append(
                f"⚠ {row['product']} inventory has only {days:.2f} days of supply"
            )

    return {
    "average_utilization": avg_utilization,
    "highest_utilization": max_utilization,
    "total_stock": total_stock,
     
    "warehouses": [
        {
            "name": row["warehouse"],
            "utilization": round(row["utilization"], 2)
        }
        for _, row in warehouse_df.iterrows()
    ],
    
   "inventory": [
    {
        "product": row["product"],
        "stock": int(row["stock"]),
        "daily_demand": int(row["daily_demand"]),
        "days_of_supply": round(
            row["stock"] / row["daily_demand"],
            2
        )
    }
    for _, row in inventory_df.iterrows()
],
        "alerts": alerts
}

@app.post("/download-report")
def download_report():

    warehouse_df = pd.read_csv("../data/warehouse.csv")

    prompt = f"""
    You are a Chief Operations Officer.

    Current warehouse data:

    {warehouse_df.to_string(index=False)}

    Generate:

    1. Executive Summary
    2. Risk Assessment
    3. Business Impact
    4. Recommended Actions

    Keep it professional.
    """

    response = model.generate_content(prompt)

    pdf_file = "operations_report.pdf"

    doc = SimpleDocTemplate(pdf_file)

    styles = getSampleStyleSheet()

    content = [
        Paragraph("AI Operations Command Center Report", styles["Title"]),
        Spacer(1, 12),
        Paragraph(response.text.replace("\n", "<br/>"), styles["BodyText"])
    ]

    doc.build(content)

    return FileResponse(
        pdf_file,
        media_type="application/pdf",
        filename="Operations_Report.pdf"
    )

@app.post("/upload-warehouse")
async def upload_warehouse(file: UploadFile = File(...)):

    content = await file.read()

    with open("../data/warehouse.csv", "wb") as f:
        f.write(content)

    return {
        "message": "Warehouse CSV uploaded successfully"
    }


@app.post("/upload-inventory")
async def upload_inventory(file: UploadFile = File(...)):

    content = await file.read()

    with open("../data/inventory.csv", "wb") as f:
        f.write(content)

    return {
        "message": "Inventory CSV uploaded successfully"
    }
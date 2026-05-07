# SHER TMS — How to Run

## ONE-TIME SETUP ONLY

1. Go to script.google.com
2. Create a new project
3. Delete all content from the default Code.gs file
4. Paste the entire contents of SHER_TMS_Complete.gs
5. Click Run → buildSHERTMS
6. Approve all permissions when prompted
7. View → Execution log → copy and save every URL printed

## IMPORTANT

Never re-run buildSHERTMS. The system is built once.
If data needs correcting, edit the spreadsheet directly.
All form URLs are printed in the execution log on first run.

## TEST FUNCTIONS (run after setup to verify automations)

Run these one at a time from the script editor:
- TEST_weeklyReport
- TEST_guideBrief
- TEST_feedbackRequests
- TEST_48hReminders

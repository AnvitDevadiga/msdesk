import unittest
import csv
import os

class TestMetricsProcessing(unittest.TestCase):
    def setUp(self):
        self.csv_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'weekly_metrics.csv')
        self.assertTrue(os.path.exists(self.csv_path), "Metrics CSV file must exist")

    def test_csv_metrics_calculation(self):
        with open(self.csv_path, 'r', encoding='utf-8') as f:
            reader = list(csv.DictReader(f))
            
        tickets = [float(r['value']) for r in reader if r['metric_name'] == 'tickets_resolved']
        hrs = [float(r['value']) for r in reader if r['metric_name'] == 'avg_resolution_time_hrs']
        uptime = [float(r['value']) for r in reader if r['metric_name'] == 'server_uptime_pct']

        self.assertEqual(len(tickets), 7, "Should have 7 days of ticket data")
        self.assertEqual(int(sum(tickets)), 370, "Total tickets resolved should be exactly 370")
        
        avg_hrs = sum(hrs) / len(hrs)
        self.assertAlmostEqual(avg_hrs, 3.44, places=2, msg="Avg resolution time should be 3.44 hrs")

        avg_uptime = sum(uptime) / len(uptime)
        self.assertAlmostEqual(avg_uptime, 99.73, places=2, msg="Avg uptime should be 99.73%")

if __name__ == '__main__':
    unittest.main()

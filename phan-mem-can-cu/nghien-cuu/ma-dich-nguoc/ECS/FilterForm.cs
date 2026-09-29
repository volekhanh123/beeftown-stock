using System;
using System.ComponentModel;
using System.Windows.Forms;
using ECS.Properties;

namespace ECS;

public class FilterForm : Form
{
	private IContainer components;

	private Button cancelButton;

	private Button okButton;

	private ComboBox fieldComboBox;

	private ComboBox condComboBox;

	private TextBox valueTextBox;

	private DateTimePicker toTimePicker;

	private DateTimePicker toDatePicker;

	private DateTimePicker fromDatePicker;

	private DateTimePicker fromTimePicker;

	public string FilterString
	{
		get
		{
			DataGridViewColumn dataGridViewColumn = (DataGridViewColumn)fieldComboBox.SelectedItem;
			string dataPropertyName = dataGridViewColumn.DataPropertyName;
			string text = valueTextBox.Text;
			string text2 = condComboBox.Text;
			if (dataGridViewColumn.ValueType == typeof(DateTime))
			{
				DateTime dateTime = new DateTime(fromDatePicker.Value.Year, fromDatePicker.Value.Month, fromDatePicker.Value.Day, fromTimePicker.Value.Hour, fromTimePicker.Value.Minute, fromTimePicker.Value.Second);
				string arg = dateTime.ToString("yyyy-MM-dd HH:mm:ss");
				dateTime = new DateTime(toDatePicker.Value.Year, toDatePicker.Value.Month, toDatePicker.Value.Day, toTimePicker.Value.Hour, toTimePicker.Value.Minute, toTimePicker.Value.Second);
				string arg2 = dateTime.ToString("yyyy-MM-dd HH:mm:ss");
				return string.Format("[{0}] >= #{1}# AND [{0}] <= #{2}#", dataPropertyName, arg, arg2);
			}
			if (dataGridViewColumn.ValueType == typeof(string))
			{
				if (text2 == Program.GetLang("pw_Like"))
				{
					return $"[{dataPropertyName}] LIKE '%{text}%'";
				}
				return $"[{dataPropertyName}] = '{text}'";
			}
			if (dataGridViewColumn.ValueType == typeof(int))
			{
				try
				{
					return $"[{dataPropertyName}] {text2} {int.Parse(text).ToString()}";
				}
				catch
				{
					return "TRUE";
				}
			}
			if (dataGridViewColumn.ValueType == typeof(decimal))
			{
				try
				{
					return $"[{dataPropertyName}] {text2} {decimal.Parse(text).ToString()}";
				}
				catch
				{
					return "TRUE";
				}
			}
			if (dataGridViewColumn.ValueType == typeof(bool))
			{
				try
				{
					return $"[{dataPropertyName}] = {text2.ToLower()}";
				}
				catch
				{
					return "TRUE";
				}
			}
			return "TRUE";
		}
	}

	public string FilterString_DT
	{
		get
		{
			DataGridViewColumn dataGridViewColumn = (DataGridViewColumn)fieldComboBox.SelectedItem;
			string dataPropertyName = dataGridViewColumn.DataPropertyName;
			string text = valueTextBox.Text;
			string text2 = condComboBox.Text;
			if (dataGridViewColumn.ValueType == typeof(DateTime))
			{
				DateTime dateTime = new DateTime(fromDatePicker.Value.Year, fromDatePicker.Value.Month, fromDatePicker.Value.Day, fromTimePicker.Value.Hour, fromTimePicker.Value.Minute, fromTimePicker.Value.Second);
				string arg = dateTime.ToString("yyyy-MM-dd HH:mm:ss");
				dateTime = new DateTime(toDatePicker.Value.Year, toDatePicker.Value.Month, toDatePicker.Value.Day, toTimePicker.Value.Hour, toTimePicker.Value.Minute, toTimePicker.Value.Second);
				string arg2 = dateTime.ToString("yyyy-MM-dd HH:mm:ss");
				return $"[{dataPropertyName}] BETWEEN #{arg}# AND #{arg2}#";
			}
			if (dataGridViewColumn.ValueType == typeof(string))
			{
				if (text2 == Program.GetLang("pw_Like"))
				{
					return $"[{dataPropertyName}] LIKE '%{text}%'";
				}
				return $"[{dataPropertyName}] = '{text}'";
			}
			if (dataGridViewColumn.ValueType == typeof(int))
			{
				try
				{
					return $"[{dataPropertyName}] {text2} {int.Parse(text).ToString()}";
				}
				catch
				{
					return "TRUE";
				}
			}
			if (dataGridViewColumn.ValueType == typeof(decimal))
			{
				try
				{
					return $"[{dataPropertyName}] {text2} {decimal.Parse(text).ToString()}";
				}
				catch
				{
					return "TRUE";
				}
			}
			if (dataGridViewColumn.ValueType == typeof(bool))
			{
				try
				{
					return $"[{dataPropertyName}] = {text2.ToLower()}";
				}
				catch
				{
					return "TRUE";
				}
			}
			return "TRUE";
		}
	}

	protected override void Dispose(bool disposing)
	{
		if (disposing && components != null)
		{
			components.Dispose();
		}
		base.Dispose(disposing);
	}

	private void InitializeComponent()
	{
		System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(ECS.FilterForm));
		this.fieldComboBox = new System.Windows.Forms.ComboBox();
		this.cancelButton = new System.Windows.Forms.Button();
		this.okButton = new System.Windows.Forms.Button();
		this.condComboBox = new System.Windows.Forms.ComboBox();
		this.valueTextBox = new System.Windows.Forms.TextBox();
		this.toTimePicker = new System.Windows.Forms.DateTimePicker();
		this.toDatePicker = new System.Windows.Forms.DateTimePicker();
		this.fromDatePicker = new System.Windows.Forms.DateTimePicker();
		this.fromTimePicker = new System.Windows.Forms.DateTimePicker();
		base.SuspendLayout();
		this.fieldComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.fieldComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.fieldComboBox, "fieldComboBox");
		this.fieldComboBox.Name = "fieldComboBox";
		this.fieldComboBox.SelectedIndexChanged += new System.EventHandler(fieldComboBox_SelectedIndexChanged);
		resources.ApplyResources(this.cancelButton, "cancelButton");
		this.cancelButton.DialogResult = System.Windows.Forms.DialogResult.Cancel;
		this.cancelButton.Name = "cancelButton";
		this.cancelButton.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.okButton, "okButton");
		this.okButton.DialogResult = System.Windows.Forms.DialogResult.OK;
		this.okButton.Name = "okButton";
		this.okButton.UseVisualStyleBackColor = true;
		this.condComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.condComboBox.FormattingEnabled = true;
		this.condComboBox.Items.AddRange(new object[5]
		{
			resources.GetString("condComboBox.Items"),
			resources.GetString("condComboBox.Items1"),
			resources.GetString("condComboBox.Items2"),
			resources.GetString("condComboBox.Items3"),
			resources.GetString("condComboBox.Items4")
		});
		resources.ApplyResources(this.condComboBox, "condComboBox");
		this.condComboBox.Name = "condComboBox";
		resources.ApplyResources(this.valueTextBox, "valueTextBox");
		this.valueTextBox.Name = "valueTextBox";
		resources.ApplyResources(this.toTimePicker, "toTimePicker");
		this.toTimePicker.Format = System.Windows.Forms.DateTimePickerFormat.Time;
		this.toTimePicker.Name = "toTimePicker";
		this.toTimePicker.ShowUpDown = true;
		resources.ApplyResources(this.toDatePicker, "toDatePicker");
		this.toDatePicker.Format = System.Windows.Forms.DateTimePickerFormat.Short;
		this.toDatePicker.Name = "toDatePicker";
		this.fromDatePicker.Format = System.Windows.Forms.DateTimePickerFormat.Short;
		resources.ApplyResources(this.fromDatePicker, "fromDatePicker");
		this.fromDatePicker.Name = "fromDatePicker";
		this.fromTimePicker.Format = System.Windows.Forms.DateTimePickerFormat.Time;
		resources.ApplyResources(this.fromTimePicker, "fromTimePicker");
		this.fromTimePicker.Name = "fromTimePicker";
		this.fromTimePicker.ShowUpDown = true;
		base.AcceptButton = this.okButton;
		resources.ApplyResources(this, "$this");
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		base.CancelButton = this.cancelButton;
		base.Controls.Add(this.toTimePicker);
		base.Controls.Add(this.toDatePicker);
		base.Controls.Add(this.fromDatePicker);
		base.Controls.Add(this.fromTimePicker);
		base.Controls.Add(this.fieldComboBox);
		base.Controls.Add(this.condComboBox);
		base.Controls.Add(this.valueTextBox);
		base.Controls.Add(this.okButton);
		base.Controls.Add(this.cancelButton);
		base.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedDialog;
		base.MaximizeBox = false;
		base.MinimizeBox = false;
		base.Name = "FilterForm";
		base.ShowIcon = false;
		base.ShowInTaskbar = false;
		base.Load += new System.EventHandler(FilterForm_Load);
		base.ResumeLayout(false);
		base.PerformLayout();
	}

	public FilterForm(DataGridView girdView)
	{
		InitializeComponent();
		if (girdView == null)
		{
			return;
		}
		fieldComboBox.BeginUpdate();
		foreach (DataGridViewColumn column in girdView.Columns)
		{
			fieldComboBox.Items.Add(column);
		}
		fieldComboBox.DisplayMember = "HeaderText";
		fieldComboBox.EndUpdate();
		fieldComboBox.SelectedIndex = 0;
		condComboBox.SelectedIndex = 0;
	}

	private void fieldComboBox_SelectedIndexChanged(object sender, EventArgs e)
	{
		condComboBox.BeginUpdate();
		condComboBox.Items.Clear();
		DataGridViewColumn dataGridViewColumn = (DataGridViewColumn)fieldComboBox.SelectedItem;
		valueTextBox.Enabled = true;
		if (dataGridViewColumn.ValueType == typeof(DateTime))
		{
			TextBox textBox = valueTextBox;
			bool visible = (condComboBox.Visible = false);
			textBox.Visible = visible;
			DateTimePicker dateTimePicker = toDatePicker;
			DateTimePicker dateTimePicker2 = toTimePicker;
			DateTimePicker dateTimePicker3 = fromDatePicker;
			bool flag2 = (fromTimePicker.Visible = true);
			bool flag4 = (dateTimePicker3.Visible = flag2);
			bool visible2 = (dateTimePicker2.Visible = flag4);
			dateTimePicker.Visible = visible2;
			return;
		}
		TextBox textBox2 = valueTextBox;
		bool visible3 = (condComboBox.Visible = true);
		textBox2.Visible = visible3;
		DateTimePicker dateTimePicker4 = toDatePicker;
		DateTimePicker dateTimePicker5 = toTimePicker;
		DateTimePicker dateTimePicker6 = fromDatePicker;
		bool flag8 = (fromTimePicker.Visible = false);
		bool flag10 = (dateTimePicker6.Visible = flag8);
		bool visible4 = (dateTimePicker5.Visible = flag10);
		dateTimePicker4.Visible = visible4;
		if (dataGridViewColumn.ValueType == typeof(int))
		{
			condComboBox.Items.AddRange(new string[5] { "=", ">", "<", ">=", "<=" });
		}
		else if (dataGridViewColumn.ValueType == typeof(string))
		{
			condComboBox.Items.AddRange(new string[2]
			{
				Program.GetLang("pw_Like"),
				"="
			});
		}
		else if (dataGridViewColumn.ValueType == typeof(decimal))
		{
			condComboBox.Items.AddRange(new string[2] { ">", "<" });
		}
		else if (dataGridViewColumn.ValueType == typeof(bool))
		{
			condComboBox.Items.AddRange(new string[2] { "True", "False" });
			valueTextBox.Enabled = false;
		}
		condComboBox.EndUpdate();
		condComboBox.SelectedIndex = 0;
	}

	private void FilterForm_Load(object sender, EventArgs e)
	{
		Text = Program.GetLang("pw_FilterTerm");
		cancelButton.Text = Program.GetLang("pw_Cancel");
		okButton.Text = Program.GetLang("pw_OK");
		if (Settings.Default.gen_dtType_Date != "")
		{
			DateTimePicker dateTimePicker = fromDatePicker;
			string customFormat = (toDatePicker.CustomFormat = Settings.Default.gen_dtType_Date);
			dateTimePicker.CustomFormat = customFormat;
			DateTimePicker dateTimePicker2 = fromDatePicker;
			DateTimePickerFormat format = (toDatePicker.Format = DateTimePickerFormat.Custom);
			dateTimePicker2.Format = format;
		}
		if (Settings.Default.gen_dtType_Time != "")
		{
			DateTimePicker dateTimePicker3 = fromTimePicker;
			string customFormat2 = (toTimePicker.CustomFormat = Settings.Default.gen_dtType_Time);
			dateTimePicker3.CustomFormat = customFormat2;
			DateTimePicker dateTimePicker4 = fromTimePicker;
			DateTimePickerFormat format2 = (toTimePicker.Format = DateTimePickerFormat.Custom);
			dateTimePicker4.Format = format2;
		}
		DateTime now = DateTime.Now;
		fromTimePicker.Value = new DateTime(now.Year, now.Month, now.Day, 0, 0, 0);
		toTimePicker.Value = new DateTime(now.Year, now.Month, now.Day, 23, 59, 59);
	}
}

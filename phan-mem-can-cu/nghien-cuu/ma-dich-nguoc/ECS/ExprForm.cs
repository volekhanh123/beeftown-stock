using System;
using System.ComponentModel;
using System.Data;
using System.Globalization;
using System.Windows.Forms;
using ECS.Properties;
using ECS.ReportDataSetTableAdapters;

namespace ECS;

public class ExprForm : Form
{
	private class SimComboVD_No
	{
		private int value;

		private string display;

		public int Value
		{
			get
			{
				return value;
			}
			set
			{
				this.value = value;
			}
		}

		public string Display
		{
			get
			{
				return display;
			}
			set
			{
				display = value;
			}
		}
	}

	private ReportDataSet.ExprRow exprRow;

	private IContainer components;

	private TabControl tabControl;

	private TabPage tableTabPage;

	private TabPage numberTabPage;

	private Button okButton;

	private Button cancelButton;

	private TabPage dateTabPage;

	private ReportDataSet reportDataSet;

	private BindingSource sGroupBindingSource;

	private BindingSource deviceBindingSource;

	private ComboBox groupComboBox;

	private ComboBox tableComboBox;

	private RadioButton groupRadioButton;

	private RadioButton tableRadioButton;

	private DateTimePicker fromTimePicker;

	private DateTimePicker fromDatePicker;

	private DateTimePicker toDatePicker;

	private DateTimePicker toTimePicker;

	private Button todayButton;

	private Button weekButton;

	private Button monthButton;

	private Button seasonButton;

	private Button yearButton;

	private ComboBox fieldComboBox;

	private BindingSource report_ColBindingSource;

	private UIDataSet uIDataSet;

	private Label fromLabel;

	private Label toLabel;

	private ComboBox opComboBox;

	private NumericUpDown numericUpDown1;

	private NumericUpDown numericUpDown2;

	private RadioButton rejectRadioButton;

	private ComboBox TypeComboBox;

	private SGroupTableAdapter sGroupTableAdapter;

	private DeviceTableAdapter deviceTableAdapter;

	public ReportDataSet.ExprRow ExprRow
	{
		get
		{
			return exprRow;
		}
		set
		{
			exprRow = value;
		}
	}

	public ExprForm()
	{
		InitializeComponent();
	}

	private string GetDisplayName(string field)
	{
		UIDataSet.Report_ColRow report_ColRow = uIDataSet.Report_Col.FindByField(field);
		if (report_ColRow == null)
		{
			return string.Empty;
		}
		return report_ColRow.Display;
	}

	private void ExprForm_Load(object sender, EventArgs e)
	{
		Text = Program.GetLang("pw_Expression");
		cancelButton.Text = Program.GetLang("pw_Cancel");
		dateTabPage.Text = Program.GetLang("pw_DateTime");
		fromLabel.Text = Program.GetLang("pw_From");
		monthButton.Text = Program.GetLang("pw_CurrentMonth");
		numberTabPage.Text = Program.GetLang("pw_Value");
		okButton.Text = Program.GetLang("pw_OK");
		seasonButton.Text = Program.GetLang("pw_CurrentQuarter");
		tableTabPage.Text = Program.GetLang("pw_Select");
		todayButton.Text = Program.GetLang("pw_Today");
		toLabel.Text = Program.GetLang("pw_To");
		weekButton.Text = Program.GetLang("pw_CurrentWeek");
		yearButton.Text = Program.GetLang("pw_CurrentYear");
		Font = Settings.Default.CustomFont;
		sGroupTableAdapter.Fill(reportDataSet.SGroup);
		deviceTableAdapter.Fill(reportDataSet.Device);
		string fileName = Application.StartupPath + "\\Combo.xml";
		uIDataSet.Report_Col.ReadXml(fileName);
		uIDataSet.SimCombo.ReadXml(fileName);
		groupRadioButton.Text = GetDisplayName("[Device].[GID]");
		tableRadioButton.Text = GetDisplayName("[Device].[MAC]");
		rejectRadioButton.Text = GetDisplayName("[LogItem].[Type]");
		tableRadioButton.Enabled = reportDataSet.Device.Count > 0;
		groupRadioButton.Enabled = reportDataSet.SGroup.Count > 0;
		string[] array = uIDataSet.SimCombo.FindByName("Logs Type Full").ValueDisplay.Split('|');
		SimComboVD_No[] array2 = new SimComboVD_No[array.Length / 2];
		SimComboVD_No[] array3 = new SimComboVD_No[array.Length / 2];
		for (int i = 0; i < array.Length / 2; i++)
		{
			SimComboVD_No simComboVD_No = new SimComboVD_No();
			simComboVD_No.Value = int.Parse(array[i * 2]);
			simComboVD_No.Display = array[i * 2 + 1];
			array2[i] = (array3[i] = simComboVD_No);
		}
		TypeComboBox.ValueMember = "Value";
		TypeComboBox.DisplayMember = "Display";
		TypeComboBox.DataSource = array2;
		opComboBox.SelectedIndex = 0;
		if (exprRow != null)
		{
			switch (exprRow.Field)
			{
			case "[Device].[GID]":
				tabControl.SelectedTab = tableTabPage;
				groupRadioButton.Checked = true;
				groupComboBox.SelectedValue = exprRow.Expr1;
				break;
			case "[Device].[MAC]":
			{
				tabControl.SelectedTab = tableTabPage;
				tableRadioButton.Checked = true;
				for (int j = 0; j < tableComboBox.Items.Count; j++)
				{
					if (((DataRowView)tableComboBox.Items[j]).Row.ItemArray[0].ToString() == exprRow.Expr1)
					{
						tableComboBox.SelectedIndex = j;
					}
				}
				break;
			}
			case "[LogItem].[Type]":
				tabControl.SelectedTab = tableTabPage;
				rejectRadioButton.Checked = true;
				TypeComboBox.SelectedIndex = Program.ParseInt(exprRow.Expr1, 0);
				break;
			case "[Log].[DateTime]":
			{
				tabControl.SelectedTab = dateTabPage;
				DateTime dateTime = DateTime.Parse(exprRow.Expr1);
				DateTimePicker dateTimePicker = fromDatePicker;
				DateTime value = (fromTimePicker.Value = dateTime);
				dateTimePicker.Value = value;
				dateTime = DateTime.Parse(exprRow.Expr2);
				DateTimePicker dateTimePicker2 = toDatePicker;
				DateTime value2 = (toTimePicker.Value = dateTime);
				dateTimePicker2.Value = value2;
				break;
			}
			default:
				tabControl.SelectedTab = numberTabPage;
				fieldComboBox.SelectedValue = exprRow.Field;
				opComboBox.Text = exprRow.Op;
				numericUpDown1.Value = decimal.Parse(exprRow.Expr1);
				numericUpDown2.Value = decimal.Parse(exprRow.Expr2);
				break;
			}
		}
		UpdateUI();
	}

	private void todayButton_Click(object sender, EventArgs e)
	{
		DateTime now = DateTime.Now;
		fromDatePicker.Value = new DateTime(now.Year, now.Month, now.Day);
		fromTimePicker.Value = new DateTime(now.Year, now.Month, now.Day, 0, 0, 0);
		toDatePicker.Value = new DateTime(now.Year, now.Month, now.Day);
		toTimePicker.Value = new DateTime(now.Year, now.Month, now.Day, 23, 59, 59);
	}

	private void weekButton_Click(object sender, EventArgs e)
	{
		DateTime now = DateTime.Now;
		DateTime dateTime = now;
		while (dateTime.DayOfWeek != DayOfWeek.Monday)
		{
			dateTime = dateTime.AddDays(-1.0);
		}
		fromDatePicker.Value = new DateTime(dateTime.Year, dateTime.Month, dateTime.Day);
		fromTimePicker.Value = new DateTime(dateTime.Year, dateTime.Month, dateTime.Day, 0, 0, 0);
		toDatePicker.Value = new DateTime(now.Year, now.Month, now.Day);
		toTimePicker.Value = new DateTime(now.Year, now.Month, now.Day, 23, 59, 59);
	}

	private void monthButton_Click(object sender, EventArgs e)
	{
		DateTime now = DateTime.Now;
		DateTime dateTime = new DateTime(now.Year, now.Month, 1);
		fromDatePicker.Value = new DateTime(dateTime.Year, dateTime.Month, dateTime.Day);
		fromTimePicker.Value = new DateTime(dateTime.Year, dateTime.Month, dateTime.Day, 0, 0, 0);
		toDatePicker.Value = new DateTime(now.Year, now.Month, now.Day);
		toTimePicker.Value = new DateTime(now.Year, now.Month, now.Day, 23, 59, 59);
	}

	private void seasonButton_Click(object sender, EventArgs e)
	{
		DateTime now = DateTime.Now;
		int num = 0;
		num = now.Month;
		while (num != 1 && num != 4 && num != 7 && num != 10)
		{
			num--;
		}
		DateTime dateTime = new DateTime(now.Year, num, 1);
		fromDatePicker.Value = new DateTime(dateTime.Year, dateTime.Month, dateTime.Day);
		fromTimePicker.Value = new DateTime(dateTime.Year, dateTime.Month, dateTime.Day, 0, 0, 0);
		toDatePicker.Value = new DateTime(now.Year, now.Month, now.Day);
		toTimePicker.Value = new DateTime(now.Year, now.Month, now.Day, 23, 59, 59);
	}

	private void yearButton_Click(object sender, EventArgs e)
	{
		DateTime now = DateTime.Now;
		DateTime dateTime = new DateTime(now.Year, 1, 1);
		fromDatePicker.Value = new DateTime(dateTime.Year, dateTime.Month, dateTime.Day);
		fromTimePicker.Value = new DateTime(dateTime.Year, dateTime.Month, dateTime.Day, 0, 0, 0);
		toDatePicker.Value = new DateTime(now.Year, now.Month, now.Day);
		toTimePicker.Value = new DateTime(now.Year, now.Month, now.Day, 23, 59, 59);
	}

	private void okButton_Click(object sender, EventArgs e)
	{
		if (tabControl.SelectedTab == tableTabPage)
		{
			if (groupRadioButton.Checked)
			{
				exprRow.Field = "[Device].[GID]";
				exprRow.Op = "=";
				exprRow.Expr1 = groupComboBox.SelectedValue.ToString();
				exprRow.Expr2 = string.Empty;
				exprRow.Display = GetDisplayName(exprRow.Field) + " = " + groupComboBox.Text;
			}
			else if (tableRadioButton.Checked)
			{
				exprRow.Field = "[Device].[MAC]";
				exprRow.Op = "=";
				exprRow.Expr1 = ((DataRowView)tableComboBox.SelectedItem).Row.ItemArray[0].ToString();
				exprRow.Expr2 = string.Empty;
				exprRow.Display = GetDisplayName(exprRow.Field) + " = " + tableComboBox.Text;
			}
			else if (rejectRadioButton.Checked)
			{
				exprRow.Field = "[LogItem].[Type]";
				exprRow.Op = string.Empty;
				exprRow.Expr1 = TypeComboBox.SelectedIndex.ToString();
				exprRow.Expr2 = string.Empty;
				exprRow.Display = GetDisplayName(exprRow.Field) + " = " + TypeComboBox.Text;
			}
		}
		else if (tabControl.SelectedTab == dateTabPage)
		{
			exprRow.Field = "[Log].[DateTime]";
			exprRow.Op = "BETWEEN";
			DateTime dateTime = new DateTime(fromDatePicker.Value.Year, fromDatePicker.Value.Month, fromDatePicker.Value.Day, fromTimePicker.Value.Hour, fromTimePicker.Value.Minute, fromTimePicker.Value.Second);
			exprRow.Expr1 = dateTime.ToString("yyyy-MM-dd HH:mm:ss");
			dateTime = new DateTime(toDatePicker.Value.Year, toDatePicker.Value.Month, toDatePicker.Value.Day, toTimePicker.Value.Hour, toTimePicker.Value.Minute, toTimePicker.Value.Second);
			exprRow.Expr2 = dateTime.ToString("yyyy-MM-dd HH:mm:ss");
			exprRow.Display = $"{GetDisplayName(exprRow.Field)} : {exprRow.Expr1} ~ {exprRow.Expr2}";
		}
		else
		{
			exprRow.Field = (string)fieldComboBox.SelectedValue;
			exprRow.Op = opComboBox.Text;
			int num = 0;
			switch (exprRow.Field)
			{
			case "[LogItem].[Count]":
				num = Settings.Default.Format_Weight;
				break;
			case "[LogItem].[Price]":
			case "[LogItem].[UnitPrice]":
			case "[LogItem].[Cost]":
			case "[LogItem].[Tax]":
				num = Settings.Default.Format_Price;
				break;
			default:
				num = 0;
				break;
			}
			string text = "F" + num;
			exprRow.Expr1 = numericUpDown1.Value.ToString(text);
			exprRow.Expr2 = numericUpDown2.Value.ToString(text);
			string displayName = GetDisplayName(exprRow.Field);
			if (exprRow.Op == "BETWEEN")
			{
				exprRow.Display = $"{displayName} : {exprRow.Expr1} ~ {exprRow.Expr2}";
			}
			else
			{
				exprRow.Display = $"{displayName} {exprRow.Op} {exprRow.Expr1}";
			}
		}
	}

	private void fieldComboBox_SelectedIndexChanged(object sender, EventArgs e)
	{
		UpdateUI();
	}

	private void opComboBox_SelectedIndexChanged(object sender, EventArgs e)
	{
		UpdateUI();
	}

	private void radioButton_CheckedChanged(object sender, EventArgs e)
	{
		UpdateUI();
	}

	private void UpdateUI()
	{
		this.numericUpDown2.Visible = opComboBox.Text == "BETWEEN";
		string text = fieldComboBox.SelectedValue as string;
		if (!string.IsNullOrEmpty(text))
		{
			switch (text)
			{
			case "[LogItem].[Count]":
			{
				NumericUpDown numericUpDown3 = numericUpDown1;
				int decimalPlaces3 = (this.numericUpDown2.DecimalPlaces = Settings.Default.Format_Weight);
				numericUpDown3.DecimalPlaces = decimalPlaces3;
				break;
			}
			case "[LogItem].[Price]":
			case "[LogItem].[UnitPrice]":
			case "[LogItem].[Cost]":
			case "[LogItem].[Tax]":
			{
				NumericUpDown numericUpDown2 = numericUpDown1;
				int decimalPlaces2 = (this.numericUpDown2.DecimalPlaces = Settings.Default.Format_Price);
				numericUpDown2.DecimalPlaces = decimalPlaces2;
				break;
			}
			default:
			{
				NumericUpDown numericUpDown = numericUpDown1;
				int decimalPlaces = (this.numericUpDown2.DecimalPlaces = 0);
				numericUpDown.DecimalPlaces = decimalPlaces;
				break;
			}
			}
			tableComboBox.Enabled = tableRadioButton.Checked;
			groupComboBox.Enabled = groupRadioButton.Checked;
			TypeComboBox.Enabled = rejectRadioButton.Checked;
		}
	}

	private void tableComboBox_Format(object sender, ListControlConvertEventArgs e)
	{
		DataRowView dataRowView = (DataRowView)e.ListItem;
		if (dataRowView != null)
		{
			e.Value = string.Format("{0} - {1}", dataRowView["MAC"], dataRowView["Name"]);
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
		this.components = new System.ComponentModel.Container();
		System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(ECS.ExprForm));
		this.tabControl = new System.Windows.Forms.TabControl();
		this.tableTabPage = new System.Windows.Forms.TabPage();
		this.tableRadioButton = new System.Windows.Forms.RadioButton();
		this.tableComboBox = new System.Windows.Forms.ComboBox();
		this.deviceBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.reportDataSet = new ECS.ReportDataSet();
		this.groupRadioButton = new System.Windows.Forms.RadioButton();
		this.TypeComboBox = new System.Windows.Forms.ComboBox();
		this.groupComboBox = new System.Windows.Forms.ComboBox();
		this.sGroupBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.rejectRadioButton = new System.Windows.Forms.RadioButton();
		this.dateTabPage = new System.Windows.Forms.TabPage();
		this.fromLabel = new System.Windows.Forms.Label();
		this.toLabel = new System.Windows.Forms.Label();
		this.fromTimePicker = new System.Windows.Forms.DateTimePicker();
		this.fromDatePicker = new System.Windows.Forms.DateTimePicker();
		this.toDatePicker = new System.Windows.Forms.DateTimePicker();
		this.toTimePicker = new System.Windows.Forms.DateTimePicker();
		this.todayButton = new System.Windows.Forms.Button();
		this.weekButton = new System.Windows.Forms.Button();
		this.monthButton = new System.Windows.Forms.Button();
		this.seasonButton = new System.Windows.Forms.Button();
		this.yearButton = new System.Windows.Forms.Button();
		this.numberTabPage = new System.Windows.Forms.TabPage();
		this.fieldComboBox = new System.Windows.Forms.ComboBox();
		this.report_ColBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.uIDataSet = new ECS.UIDataSet();
		this.opComboBox = new System.Windows.Forms.ComboBox();
		this.numericUpDown1 = new System.Windows.Forms.NumericUpDown();
		this.numericUpDown2 = new System.Windows.Forms.NumericUpDown();
		this.okButton = new System.Windows.Forms.Button();
		this.cancelButton = new System.Windows.Forms.Button();
		this.sGroupTableAdapter = new ECS.ReportDataSetTableAdapters.SGroupTableAdapter();
		this.deviceTableAdapter = new ECS.ReportDataSetTableAdapters.DeviceTableAdapter();
		this.tabControl.SuspendLayout();
		this.tableTabPage.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.deviceBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.reportDataSet).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.sGroupBindingSource).BeginInit();
		this.dateTabPage.SuspendLayout();
		this.numberTabPage.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.report_ColBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.uIDataSet).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.numericUpDown1).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.numericUpDown2).BeginInit();
		base.SuspendLayout();
		this.tabControl.Controls.Add(this.tableTabPage);
		this.tabControl.Controls.Add(this.dateTabPage);
		this.tabControl.Controls.Add(this.numberTabPage);
		resources.ApplyResources(this.tabControl, "tabControl");
		this.tabControl.Name = "tabControl";
		this.tabControl.SelectedIndex = 0;
		resources.ApplyResources(this.tableTabPage, "tableTabPage");
		this.tableTabPage.Controls.Add(this.tableRadioButton);
		this.tableTabPage.Controls.Add(this.tableComboBox);
		this.tableTabPage.Controls.Add(this.groupRadioButton);
		this.tableTabPage.Controls.Add(this.TypeComboBox);
		this.tableTabPage.Controls.Add(this.groupComboBox);
		this.tableTabPage.Controls.Add(this.rejectRadioButton);
		this.tableTabPage.Name = "tableTabPage";
		this.tableTabPage.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.tableRadioButton, "tableRadioButton");
		this.tableRadioButton.Name = "tableRadioButton";
		this.tableRadioButton.UseVisualStyleBackColor = true;
		this.tableRadioButton.CheckedChanged += new System.EventHandler(radioButton_CheckedChanged);
		this.tableComboBox.DataSource = this.deviceBindingSource;
		this.tableComboBox.DisplayMember = "Name";
		this.tableComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.tableComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.tableComboBox, "tableComboBox");
		this.tableComboBox.Name = "tableComboBox";
		this.tableComboBox.ValueMember = "TID";
		this.tableComboBox.Format += new System.Windows.Forms.ListControlConvertEventHandler(tableComboBox_Format);
		this.deviceBindingSource.DataMember = "Device";
		this.deviceBindingSource.DataSource = this.reportDataSet;
		this.deviceBindingSource.Filter = "GID > 0";
		this.reportDataSet.DataSetName = "ReportDataSet";
		this.reportDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		resources.ApplyResources(this.groupRadioButton, "groupRadioButton");
		this.groupRadioButton.Name = "groupRadioButton";
		this.groupRadioButton.UseVisualStyleBackColor = true;
		this.groupRadioButton.CheckedChanged += new System.EventHandler(radioButton_CheckedChanged);
		this.TypeComboBox.DisplayMember = "Name";
		this.TypeComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.TypeComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.TypeComboBox, "TypeComboBox");
		this.TypeComboBox.Name = "TypeComboBox";
		this.TypeComboBox.ValueMember = "GID";
		this.groupComboBox.DataSource = this.sGroupBindingSource;
		this.groupComboBox.DisplayMember = "Name";
		this.groupComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.groupComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.groupComboBox, "groupComboBox");
		this.groupComboBox.Name = "groupComboBox";
		this.groupComboBox.ValueMember = "GID";
		this.sGroupBindingSource.DataMember = "SGroup";
		this.sGroupBindingSource.DataSource = this.reportDataSet;
		this.sGroupBindingSource.Filter = "GID > 0";
		resources.ApplyResources(this.rejectRadioButton, "rejectRadioButton");
		this.rejectRadioButton.Checked = true;
		this.rejectRadioButton.Name = "rejectRadioButton";
		this.rejectRadioButton.TabStop = true;
		this.rejectRadioButton.UseVisualStyleBackColor = true;
		this.rejectRadioButton.CheckedChanged += new System.EventHandler(radioButton_CheckedChanged);
		this.dateTabPage.Controls.Add(this.fromLabel);
		this.dateTabPage.Controls.Add(this.toLabel);
		this.dateTabPage.Controls.Add(this.fromTimePicker);
		this.dateTabPage.Controls.Add(this.fromDatePicker);
		this.dateTabPage.Controls.Add(this.toDatePicker);
		this.dateTabPage.Controls.Add(this.toTimePicker);
		this.dateTabPage.Controls.Add(this.todayButton);
		this.dateTabPage.Controls.Add(this.weekButton);
		this.dateTabPage.Controls.Add(this.monthButton);
		this.dateTabPage.Controls.Add(this.seasonButton);
		this.dateTabPage.Controls.Add(this.yearButton);
		resources.ApplyResources(this.dateTabPage, "dateTabPage");
		this.dateTabPage.Name = "dateTabPage";
		this.dateTabPage.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.fromLabel, "fromLabel");
		this.fromLabel.Name = "fromLabel";
		resources.ApplyResources(this.toLabel, "toLabel");
		this.toLabel.Name = "toLabel";
		this.fromTimePicker.Format = System.Windows.Forms.DateTimePickerFormat.Time;
		resources.ApplyResources(this.fromTimePicker, "fromTimePicker");
		this.fromTimePicker.Name = "fromTimePicker";
		this.fromTimePicker.ShowUpDown = true;
		this.fromDatePicker.Format = System.Windows.Forms.DateTimePickerFormat.Short;
		resources.ApplyResources(this.fromDatePicker, "fromDatePicker");
		this.fromDatePicker.Name = "fromDatePicker";
		this.toDatePicker.Format = System.Windows.Forms.DateTimePickerFormat.Short;
		resources.ApplyResources(this.toDatePicker, "toDatePicker");
		this.toDatePicker.Name = "toDatePicker";
		this.toTimePicker.Format = System.Windows.Forms.DateTimePickerFormat.Time;
		resources.ApplyResources(this.toTimePicker, "toTimePicker");
		this.toTimePicker.Name = "toTimePicker";
		this.toTimePicker.ShowUpDown = true;
		resources.ApplyResources(this.todayButton, "todayButton");
		this.todayButton.Name = "todayButton";
		this.todayButton.UseVisualStyleBackColor = true;
		this.todayButton.Click += new System.EventHandler(todayButton_Click);
		resources.ApplyResources(this.weekButton, "weekButton");
		this.weekButton.Name = "weekButton";
		this.weekButton.UseVisualStyleBackColor = true;
		this.weekButton.Click += new System.EventHandler(weekButton_Click);
		resources.ApplyResources(this.monthButton, "monthButton");
		this.monthButton.Name = "monthButton";
		this.monthButton.UseVisualStyleBackColor = true;
		this.monthButton.Click += new System.EventHandler(monthButton_Click);
		resources.ApplyResources(this.seasonButton, "seasonButton");
		this.seasonButton.Name = "seasonButton";
		this.seasonButton.UseVisualStyleBackColor = true;
		this.seasonButton.Click += new System.EventHandler(seasonButton_Click);
		resources.ApplyResources(this.yearButton, "yearButton");
		this.yearButton.Name = "yearButton";
		this.yearButton.UseVisualStyleBackColor = true;
		this.yearButton.Click += new System.EventHandler(yearButton_Click);
		this.numberTabPage.Controls.Add(this.fieldComboBox);
		this.numberTabPage.Controls.Add(this.opComboBox);
		this.numberTabPage.Controls.Add(this.numericUpDown1);
		this.numberTabPage.Controls.Add(this.numericUpDown2);
		resources.ApplyResources(this.numberTabPage, "numberTabPage");
		this.numberTabPage.Name = "numberTabPage";
		this.numberTabPage.UseVisualStyleBackColor = true;
		this.fieldComboBox.DataSource = this.report_ColBindingSource;
		this.fieldComboBox.DisplayMember = "Display";
		this.fieldComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.fieldComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.fieldComboBox, "fieldComboBox");
		this.fieldComboBox.Name = "fieldComboBox";
		this.fieldComboBox.ValueMember = "Field";
		this.fieldComboBox.SelectedIndexChanged += new System.EventHandler(fieldComboBox_SelectedIndexChanged);
		this.report_ColBindingSource.DataMember = "Report_Col";
		this.report_ColBindingSource.DataSource = this.uIDataSet;
		this.report_ColBindingSource.Filter = "[Field] <> '' AND [Field] <> 'GID' AND [Field] <> '[Device].[MAC]' AND [Field] <> '[LogItem].[Type]' AND [Field] <> '[Log].[DateTime]'";
		this.uIDataSet.DataSetName = "UIDataSet";
		this.uIDataSet.Locale = new System.Globalization.CultureInfo("zh-CN");
		this.uIDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		this.opComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.opComboBox.FormattingEnabled = true;
		this.opComboBox.Items.AddRange(new object[7]
		{
			resources.GetString("opComboBox.Items"),
			resources.GetString("opComboBox.Items1"),
			resources.GetString("opComboBox.Items2"),
			resources.GetString("opComboBox.Items3"),
			resources.GetString("opComboBox.Items4"),
			resources.GetString("opComboBox.Items5"),
			resources.GetString("opComboBox.Items6")
		});
		resources.ApplyResources(this.opComboBox, "opComboBox");
		this.opComboBox.Name = "opComboBox";
		this.opComboBox.SelectedIndexChanged += new System.EventHandler(opComboBox_SelectedIndexChanged);
		resources.ApplyResources(this.numericUpDown1, "numericUpDown1");
		this.numericUpDown1.Maximum = new decimal(new int[4] { 99999999, 0, 0, 0 });
		this.numericUpDown1.Name = "numericUpDown1";
		resources.ApplyResources(this.numericUpDown2, "numericUpDown2");
		this.numericUpDown2.Maximum = new decimal(new int[4] { 99999999, 0, 0, 0 });
		this.numericUpDown2.Name = "numericUpDown2";
		this.okButton.DialogResult = System.Windows.Forms.DialogResult.OK;
		resources.ApplyResources(this.okButton, "okButton");
		this.okButton.Name = "okButton";
		this.okButton.UseVisualStyleBackColor = true;
		this.okButton.Click += new System.EventHandler(okButton_Click);
		this.cancelButton.DialogResult = System.Windows.Forms.DialogResult.Cancel;
		resources.ApplyResources(this.cancelButton, "cancelButton");
		this.cancelButton.Name = "cancelButton";
		this.cancelButton.UseVisualStyleBackColor = true;
		this.sGroupTableAdapter.ClearBeforeFill = true;
		this.deviceTableAdapter.ClearBeforeFill = true;
		base.AcceptButton = this.okButton;
		resources.ApplyResources(this, "$this");
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		base.CancelButton = this.cancelButton;
		base.Controls.Add(this.tabControl);
		base.Controls.Add(this.okButton);
		base.Controls.Add(this.cancelButton);
		base.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedDialog;
		base.MaximizeBox = false;
		base.MinimizeBox = false;
		base.Name = "ExprForm";
		base.ShowIcon = false;
		base.ShowInTaskbar = false;
		base.Load += new System.EventHandler(ExprForm_Load);
		this.tabControl.ResumeLayout(false);
		this.tableTabPage.ResumeLayout(false);
		this.tableTabPage.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.deviceBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.reportDataSet).EndInit();
		((System.ComponentModel.ISupportInitialize)this.sGroupBindingSource).EndInit();
		this.dateTabPage.ResumeLayout(false);
		this.dateTabPage.PerformLayout();
		this.numberTabPage.ResumeLayout(false);
		((System.ComponentModel.ISupportInitialize)this.report_ColBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.uIDataSet).EndInit();
		((System.ComponentModel.ISupportInitialize)this.numericUpDown1).EndInit();
		((System.ComponentModel.ISupportInitialize)this.numericUpDown2).EndInit();
		base.ResumeLayout(false);
	}
}

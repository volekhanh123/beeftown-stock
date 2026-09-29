using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Globalization;
using System.IO;
using System.IO.Ports;
using System.Text;
using System.Windows.Forms;
using ECS.ECSDataSetTableAdapters;
using ECS.Properties;

namespace ECS;

public class SaveForm : Form
{
	private IContainer components;

	private ECSDataSet eCSDataSet;

	private DeptTableAdapter deptTableAdapter;

	private ClassTableAdapter classTableAdapter;

	private CheckBox deptCheckBox;

	private CheckBox classCheckBox;

	private Button exeButton;

	private CheckBox unitCheckBox;

	private UnitTableAdapter unitTableAdapter;

	private BarcodeTableAdapter barcodeTableAdapter;

	private SalesmanTableAdapter salesmanTableAdapter;

	private CheckBox salesmanCheckBox;

	private CheckBox barcodeCheckBox;

	private CheckBox pLUCheckBox;

	private PLUTableAdapter pLUTableAdapter;

	private CheckBox labelCheckBox;

	private LabelTableAdapter labelTableAdapter;

	private LabelItemTableAdapter labelItemTableAdapter;

	private CheckBox faceCheckBox;

	private CheckBox stringCheckBox;

	private CheckBox specCheckBox;

	private StringTableAdapter stringTableAdapter;

	private FaceTableAdapter faceTableAdapter;

	private SpecTableAdapter specTableAdapter;

	private CheckBox updateCheckBox;

	private NumericUpDown numericUpDown;

	private ComboBox driveComboBox;

	private RadioButton generateRadioButton;

	private RadioButton customRadioButton;

	private Button browseButton;

	private TextBox filenameTextBox;

	private CheckBox selAllCheckBox;

	private ECSDataSet ecsOldSet;

	private ComboBox baudComboBox;

	private ComboBox serialComboBox;

	private RadioButton serialRadioButton;

	private SerialPort serialPort;

	private CheckBox clearCheckBox;

	private CheckBox fontCheckBox;

	private CheckBox bmpCheckBox;

	private GroupBox sourceGroupBox;

	private RadioButton openButton;

	private RadioButton saveButton;

	private Button cancelButton;

	private CheckBox custom1CheckBox;

	private CheckBox custom2CheckBox;

	private CheckBox custom3CheckBox;

	private CheckBox custom4CheckBox;

	private UIDataSet uiDataSet;

	private Custom1TableAdapter custom1TableAdapter;

	private Custom2TableAdapter custom2TableAdapter;

	private Custom3TableAdapter custom3TableAdapter;

	private Custom4TableAdapter custom4TableAdapter;

	private CheckBox wizardCheckBox;

	private CheckBox vipCheckBox;

	private CheckBox vipPointCheckBox;

	private FaceListTableAdapter faceListTableAdapter;

	private ComboBox fontComboBox;

	private VIPTableAdapter vipTableAdapter;

	private ComboBox faceListComboBox;

	private BindingSource faceListBindingSource;

	private UIDataSet.CustomRow custom1Row;

	private UIDataSet.CustomRow custom2Row;

	private UIDataSet.CustomRow custom3Row;

	private UIDataSet.CustomRow custom4Row;

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
		System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(ECS.SaveForm));
		this.eCSDataSet = new ECS.ECSDataSet();
		this.deptTableAdapter = new ECS.ECSDataSetTableAdapters.DeptTableAdapter();
		this.classTableAdapter = new ECS.ECSDataSetTableAdapters.ClassTableAdapter();
		this.deptCheckBox = new System.Windows.Forms.CheckBox();
		this.classCheckBox = new System.Windows.Forms.CheckBox();
		this.exeButton = new System.Windows.Forms.Button();
		this.unitCheckBox = new System.Windows.Forms.CheckBox();
		this.unitTableAdapter = new ECS.ECSDataSetTableAdapters.UnitTableAdapter();
		this.barcodeTableAdapter = new ECS.ECSDataSetTableAdapters.BarcodeTableAdapter();
		this.salesmanTableAdapter = new ECS.ECSDataSetTableAdapters.SalesmanTableAdapter();
		this.salesmanCheckBox = new System.Windows.Forms.CheckBox();
		this.barcodeCheckBox = new System.Windows.Forms.CheckBox();
		this.pLUCheckBox = new System.Windows.Forms.CheckBox();
		this.pLUTableAdapter = new ECS.ECSDataSetTableAdapters.PLUTableAdapter();
		this.labelCheckBox = new System.Windows.Forms.CheckBox();
		this.labelTableAdapter = new ECS.ECSDataSetTableAdapters.LabelTableAdapter();
		this.labelItemTableAdapter = new ECS.ECSDataSetTableAdapters.LabelItemTableAdapter();
		this.faceCheckBox = new System.Windows.Forms.CheckBox();
		this.stringCheckBox = new System.Windows.Forms.CheckBox();
		this.specCheckBox = new System.Windows.Forms.CheckBox();
		this.stringTableAdapter = new ECS.ECSDataSetTableAdapters.StringTableAdapter();
		this.faceTableAdapter = new ECS.ECSDataSetTableAdapters.FaceTableAdapter();
		this.specTableAdapter = new ECS.ECSDataSetTableAdapters.SpecTableAdapter();
		this.updateCheckBox = new System.Windows.Forms.CheckBox();
		this.numericUpDown = new System.Windows.Forms.NumericUpDown();
		this.driveComboBox = new System.Windows.Forms.ComboBox();
		this.generateRadioButton = new System.Windows.Forms.RadioButton();
		this.customRadioButton = new System.Windows.Forms.RadioButton();
		this.browseButton = new System.Windows.Forms.Button();
		this.filenameTextBox = new System.Windows.Forms.TextBox();
		this.selAllCheckBox = new System.Windows.Forms.CheckBox();
		this.ecsOldSet = new ECS.ECSDataSet();
		this.baudComboBox = new System.Windows.Forms.ComboBox();
		this.serialComboBox = new System.Windows.Forms.ComboBox();
		this.serialRadioButton = new System.Windows.Forms.RadioButton();
		this.serialPort = new System.IO.Ports.SerialPort(this.components);
		this.clearCheckBox = new System.Windows.Forms.CheckBox();
		this.fontCheckBox = new System.Windows.Forms.CheckBox();
		this.bmpCheckBox = new System.Windows.Forms.CheckBox();
		this.sourceGroupBox = new System.Windows.Forms.GroupBox();
		this.openButton = new System.Windows.Forms.RadioButton();
		this.saveButton = new System.Windows.Forms.RadioButton();
		this.cancelButton = new System.Windows.Forms.Button();
		this.custom1CheckBox = new System.Windows.Forms.CheckBox();
		this.custom2CheckBox = new System.Windows.Forms.CheckBox();
		this.custom3CheckBox = new System.Windows.Forms.CheckBox();
		this.custom4CheckBox = new System.Windows.Forms.CheckBox();
		this.uiDataSet = new ECS.UIDataSet();
		this.custom1TableAdapter = new ECS.ECSDataSetTableAdapters.Custom1TableAdapter();
		this.custom2TableAdapter = new ECS.ECSDataSetTableAdapters.Custom2TableAdapter();
		this.custom3TableAdapter = new ECS.ECSDataSetTableAdapters.Custom3TableAdapter();
		this.custom4TableAdapter = new ECS.ECSDataSetTableAdapters.Custom4TableAdapter();
		this.wizardCheckBox = new System.Windows.Forms.CheckBox();
		this.vipCheckBox = new System.Windows.Forms.CheckBox();
		this.vipPointCheckBox = new System.Windows.Forms.CheckBox();
		this.faceListTableAdapter = new ECS.ECSDataSetTableAdapters.FaceListTableAdapter();
		this.fontComboBox = new System.Windows.Forms.ComboBox();
		this.vipTableAdapter = new ECS.ECSDataSetTableAdapters.VIPTableAdapter();
		this.faceListComboBox = new System.Windows.Forms.ComboBox();
		this.faceListBindingSource = new System.Windows.Forms.BindingSource(this.components);
		((System.ComponentModel.ISupportInitialize)this.eCSDataSet).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.numericUpDown).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.ecsOldSet).BeginInit();
		this.sourceGroupBox.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.uiDataSet).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.faceListBindingSource).BeginInit();
		base.SuspendLayout();
		this.eCSDataSet.DataSetName = "ECSDataSet";
		this.eCSDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		this.deptTableAdapter.ClearBeforeFill = true;
		this.classTableAdapter.ClearBeforeFill = true;
		resources.ApplyResources(this.deptCheckBox, "deptCheckBox");
		this.deptCheckBox.Name = "deptCheckBox";
		this.deptCheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.classCheckBox, "classCheckBox");
		this.classCheckBox.Name = "classCheckBox";
		this.classCheckBox.UseVisualStyleBackColor = true;
		this.exeButton.DialogResult = System.Windows.Forms.DialogResult.Cancel;
		resources.ApplyResources(this.exeButton, "exeButton");
		this.exeButton.Name = "exeButton";
		this.exeButton.UseVisualStyleBackColor = true;
		this.exeButton.Click += new System.EventHandler(exeButton_Click);
		resources.ApplyResources(this.unitCheckBox, "unitCheckBox");
		this.unitCheckBox.Name = "unitCheckBox";
		this.unitCheckBox.UseVisualStyleBackColor = true;
		this.unitTableAdapter.ClearBeforeFill = true;
		this.barcodeTableAdapter.ClearBeforeFill = true;
		this.salesmanTableAdapter.ClearBeforeFill = true;
		resources.ApplyResources(this.salesmanCheckBox, "salesmanCheckBox");
		this.salesmanCheckBox.Name = "salesmanCheckBox";
		this.salesmanCheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.barcodeCheckBox, "barcodeCheckBox");
		this.barcodeCheckBox.Name = "barcodeCheckBox";
		this.barcodeCheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.pLUCheckBox, "pLUCheckBox");
		this.pLUCheckBox.Name = "pLUCheckBox";
		this.pLUCheckBox.ThreeState = true;
		this.pLUCheckBox.UseVisualStyleBackColor = true;
		this.pLUTableAdapter.ClearBeforeFill = true;
		resources.ApplyResources(this.labelCheckBox, "labelCheckBox");
		this.labelCheckBox.Name = "labelCheckBox";
		this.labelCheckBox.UseVisualStyleBackColor = true;
		this.labelTableAdapter.ClearBeforeFill = true;
		this.labelItemTableAdapter.ClearBeforeFill = true;
		resources.ApplyResources(this.faceCheckBox, "faceCheckBox");
		this.faceCheckBox.Name = "faceCheckBox";
		this.faceCheckBox.UseVisualStyleBackColor = true;
		this.faceCheckBox.CheckedChanged += new System.EventHandler(faceCheckBox_CheckedChanged);
		resources.ApplyResources(this.stringCheckBox, "stringCheckBox");
		this.stringCheckBox.Name = "stringCheckBox";
		this.stringCheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.specCheckBox, "specCheckBox");
		this.specCheckBox.Name = "specCheckBox";
		this.specCheckBox.UseVisualStyleBackColor = true;
		this.stringTableAdapter.ClearBeforeFill = true;
		this.faceTableAdapter.ClearBeforeFill = true;
		this.specTableAdapter.ClearBeforeFill = true;
		resources.ApplyResources(this.updateCheckBox, "updateCheckBox");
		this.updateCheckBox.Checked = true;
		this.updateCheckBox.CheckState = System.Windows.Forms.CheckState.Checked;
		this.updateCheckBox.Name = "updateCheckBox";
		this.updateCheckBox.UseVisualStyleBackColor = true;
		this.updateCheckBox.CheckedChanged += new System.EventHandler(updateCheckBox_CheckedChanged);
		resources.ApplyResources(this.numericUpDown, "numericUpDown");
		this.numericUpDown.Maximum = new decimal(new int[4] { 999, 0, 0, 0 });
		this.numericUpDown.Name = "numericUpDown";
		this.numericUpDown.ValueChanged += new System.EventHandler(driveComboBox_SelectedIndexChanged);
		this.driveComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.driveComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.driveComboBox, "driveComboBox");
		this.driveComboBox.Name = "driveComboBox";
		this.driveComboBox.SelectedIndexChanged += new System.EventHandler(driveComboBox_SelectedIndexChanged);
		resources.ApplyResources(this.generateRadioButton, "generateRadioButton");
		this.generateRadioButton.Checked = true;
		this.generateRadioButton.Name = "generateRadioButton";
		this.generateRadioButton.TabStop = true;
		this.generateRadioButton.UseVisualStyleBackColor = true;
		this.generateRadioButton.CheckedChanged += new System.EventHandler(customRadioButton_CheckedChanged);
		resources.ApplyResources(this.customRadioButton, "customRadioButton");
		this.customRadioButton.Name = "customRadioButton";
		this.customRadioButton.UseVisualStyleBackColor = true;
		this.customRadioButton.CheckedChanged += new System.EventHandler(customRadioButton_CheckedChanged);
		resources.ApplyResources(this.browseButton, "browseButton");
		this.browseButton.Name = "browseButton";
		this.browseButton.UseVisualStyleBackColor = true;
		this.browseButton.Click += new System.EventHandler(browseButton_Click);
		resources.ApplyResources(this.filenameTextBox, "filenameTextBox");
		this.filenameTextBox.Name = "filenameTextBox";
		resources.ApplyResources(this.selAllCheckBox, "selAllCheckBox");
		this.selAllCheckBox.Name = "selAllCheckBox";
		this.selAllCheckBox.UseVisualStyleBackColor = true;
		this.selAllCheckBox.CheckedChanged += new System.EventHandler(selAllCheckBox_CheckedChanged);
		this.ecsOldSet.DataSetName = "ECSDataSet";
		this.ecsOldSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		resources.ApplyResources(this.baudComboBox, "baudComboBox");
		this.baudComboBox.FormattingEnabled = true;
		this.baudComboBox.Items.AddRange(new object[14]
		{
			resources.GetString("baudComboBox.Items"),
			resources.GetString("baudComboBox.Items1"),
			resources.GetString("baudComboBox.Items2"),
			resources.GetString("baudComboBox.Items3"),
			resources.GetString("baudComboBox.Items4"),
			resources.GetString("baudComboBox.Items5"),
			resources.GetString("baudComboBox.Items6"),
			resources.GetString("baudComboBox.Items7"),
			resources.GetString("baudComboBox.Items8"),
			resources.GetString("baudComboBox.Items9"),
			resources.GetString("baudComboBox.Items10"),
			resources.GetString("baudComboBox.Items11"),
			resources.GetString("baudComboBox.Items12"),
			resources.GetString("baudComboBox.Items13")
		});
		this.baudComboBox.Name = "baudComboBox";
		resources.ApplyResources(this.serialComboBox, "serialComboBox");
		this.serialComboBox.FormattingEnabled = true;
		this.serialComboBox.Name = "serialComboBox";
		resources.ApplyResources(this.serialRadioButton, "serialRadioButton");
		this.serialRadioButton.Name = "serialRadioButton";
		this.serialRadioButton.UseVisualStyleBackColor = true;
		this.serialRadioButton.CheckedChanged += new System.EventHandler(customRadioButton_CheckedChanged);
		this.serialPort.BaudRate = ECS.Properties.Settings.Default.serailBaudRate;
		this.serialPort.DataBits = ECS.Properties.Settings.Default.serialDataBits;
		this.serialPort.Handshake = ECS.Properties.Settings.Default.serialHandShake;
		this.serialPort.Parity = ECS.Properties.Settings.Default.serialParity;
		this.serialPort.ReadTimeout = ECS.Properties.Settings.Default.recvTimeOut;
		this.serialPort.StopBits = ECS.Properties.Settings.Default.serialStopBits;
		this.serialPort.WriteTimeout = ECS.Properties.Settings.Default.recvTimeOut;
		resources.ApplyResources(this.clearCheckBox, "clearCheckBox");
		this.clearCheckBox.Name = "clearCheckBox";
		this.clearCheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.fontCheckBox, "fontCheckBox");
		this.fontCheckBox.Name = "fontCheckBox";
		this.fontCheckBox.UseVisualStyleBackColor = true;
		this.fontCheckBox.CheckedChanged += new System.EventHandler(fontCheckBox_CheckedChanged);
		resources.ApplyResources(this.bmpCheckBox, "bmpCheckBox");
		this.bmpCheckBox.Name = "bmpCheckBox";
		this.bmpCheckBox.UseVisualStyleBackColor = true;
		this.sourceGroupBox.Controls.Add(this.baudComboBox);
		this.sourceGroupBox.Controls.Add(this.serialComboBox);
		this.sourceGroupBox.Controls.Add(this.serialRadioButton);
		this.sourceGroupBox.Controls.Add(this.updateCheckBox);
		this.sourceGroupBox.Controls.Add(this.customRadioButton);
		this.sourceGroupBox.Controls.Add(this.browseButton);
		this.sourceGroupBox.Controls.Add(this.numericUpDown);
		this.sourceGroupBox.Controls.Add(this.filenameTextBox);
		this.sourceGroupBox.Controls.Add(this.driveComboBox);
		this.sourceGroupBox.Controls.Add(this.generateRadioButton);
		resources.ApplyResources(this.sourceGroupBox, "sourceGroupBox");
		this.sourceGroupBox.Name = "sourceGroupBox";
		this.sourceGroupBox.TabStop = false;
		resources.ApplyResources(this.openButton, "openButton");
		this.openButton.Name = "openButton";
		this.openButton.UseVisualStyleBackColor = true;
		this.openButton.CheckedChanged += new System.EventHandler(saveButton_CheckedChanged);
		resources.ApplyResources(this.saveButton, "saveButton");
		this.saveButton.Name = "saveButton";
		this.saveButton.UseVisualStyleBackColor = true;
		this.saveButton.CheckedChanged += new System.EventHandler(saveButton_CheckedChanged);
		this.cancelButton.DialogResult = System.Windows.Forms.DialogResult.Cancel;
		resources.ApplyResources(this.cancelButton, "cancelButton");
		this.cancelButton.Name = "cancelButton";
		this.cancelButton.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.custom1CheckBox, "custom1CheckBox");
		this.custom1CheckBox.Name = "custom1CheckBox";
		this.custom1CheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.custom2CheckBox, "custom2CheckBox");
		this.custom2CheckBox.Name = "custom2CheckBox";
		this.custom2CheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.custom3CheckBox, "custom3CheckBox");
		this.custom3CheckBox.Name = "custom3CheckBox";
		this.custom3CheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.custom4CheckBox, "custom4CheckBox");
		this.custom4CheckBox.Name = "custom4CheckBox";
		this.custom4CheckBox.UseVisualStyleBackColor = true;
		this.uiDataSet.DataSetName = "UIDataSet";
		this.uiDataSet.Locale = new System.Globalization.CultureInfo("zh-CN");
		this.uiDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		this.custom1TableAdapter.ClearBeforeFill = true;
		this.custom2TableAdapter.ClearBeforeFill = true;
		this.custom3TableAdapter.ClearBeforeFill = true;
		this.custom4TableAdapter.ClearBeforeFill = true;
		resources.ApplyResources(this.wizardCheckBox, "wizardCheckBox");
		this.wizardCheckBox.ForeColor = System.Drawing.Color.Red;
		this.wizardCheckBox.Name = "wizardCheckBox";
		this.wizardCheckBox.UseVisualStyleBackColor = true;
		this.wizardCheckBox.CheckedChanged += new System.EventHandler(quicksetCheckBox_CheckedChanged);
		resources.ApplyResources(this.vipCheckBox, "vipCheckBox");
		this.vipCheckBox.Name = "vipCheckBox";
		this.vipCheckBox.UseVisualStyleBackColor = true;
		this.vipCheckBox.CheckedChanged += new System.EventHandler(vipCheckBox_CheckedChanged);
		resources.ApplyResources(this.vipPointCheckBox, "vipPointCheckBox");
		this.vipPointCheckBox.Name = "vipPointCheckBox";
		this.vipPointCheckBox.UseVisualStyleBackColor = true;
		this.faceListTableAdapter.ClearBeforeFill = true;
		this.fontComboBox.DropDownWidth = 200;
		resources.ApplyResources(this.fontComboBox, "fontComboBox");
		this.fontComboBox.FormattingEnabled = true;
		this.fontComboBox.Name = "fontComboBox";
		this.vipTableAdapter.ClearBeforeFill = true;
		this.faceListComboBox.DataSource = this.faceListBindingSource;
		this.faceListComboBox.DisplayMember = "ScaleID";
		this.faceListComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		resources.ApplyResources(this.faceListComboBox, "faceListComboBox");
		this.faceListComboBox.FormattingEnabled = true;
		this.faceListComboBox.Name = "faceListComboBox";
		this.faceListComboBox.ValueMember = "ScaleID";
		this.faceListBindingSource.DataMember = "FaceList";
		this.faceListBindingSource.DataSource = this.eCSDataSet;
		base.AcceptButton = this.exeButton;
		resources.ApplyResources(this, "$this");
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		base.CancelButton = this.cancelButton;
		base.Controls.Add(this.faceListComboBox);
		base.Controls.Add(this.fontComboBox);
		base.Controls.Add(this.custom4CheckBox);
		base.Controls.Add(this.custom3CheckBox);
		base.Controls.Add(this.custom2CheckBox);
		base.Controls.Add(this.custom1CheckBox);
		base.Controls.Add(this.cancelButton);
		base.Controls.Add(this.saveButton);
		base.Controls.Add(this.openButton);
		base.Controls.Add(this.sourceGroupBox);
		base.Controls.Add(this.vipPointCheckBox);
		base.Controls.Add(this.vipCheckBox);
		base.Controls.Add(this.bmpCheckBox);
		base.Controls.Add(this.fontCheckBox);
		base.Controls.Add(this.wizardCheckBox);
		base.Controls.Add(this.clearCheckBox);
		base.Controls.Add(this.selAllCheckBox);
		base.Controls.Add(this.faceCheckBox);
		base.Controls.Add(this.stringCheckBox);
		base.Controls.Add(this.specCheckBox);
		base.Controls.Add(this.labelCheckBox);
		base.Controls.Add(this.pLUCheckBox);
		base.Controls.Add(this.barcodeCheckBox);
		base.Controls.Add(this.salesmanCheckBox);
		base.Controls.Add(this.unitCheckBox);
		base.Controls.Add(this.exeButton);
		base.Controls.Add(this.classCheckBox);
		base.Controls.Add(this.deptCheckBox);
		base.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedDialog;
		base.MaximizeBox = false;
		base.MinimizeBox = false;
		base.Name = "SaveForm";
		base.ShowIcon = false;
		base.ShowInTaskbar = false;
		base.Load += new System.EventHandler(SaveForm_Load);
		((System.ComponentModel.ISupportInitialize)this.eCSDataSet).EndInit();
		((System.ComponentModel.ISupportInitialize)this.numericUpDown).EndInit();
		((System.ComponentModel.ISupportInitialize)this.ecsOldSet).EndInit();
		this.sourceGroupBox.ResumeLayout(false);
		this.sourceGroupBox.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.uiDataSet).EndInit();
		((System.ComponentModel.ISupportInitialize)this.faceListBindingSource).EndInit();
		base.ResumeLayout(false);
		base.PerformLayout();
	}

	public SaveForm()
	{
		InitializeComponent();
	}

	private void GenerateFileName()
	{
		if (updateCheckBox.Checked)
		{
			filenameTextBox.Text = driveComboBox.Text + "JHSCALE\\A_xxx.TMS";
		}
		else
		{
			filenameTextBox.Text = driveComboBox.Text + $"JHSCALE\\A_{(int)numericUpDown.Value:d3}.TMS";
		}
	}

	private void FindCustom()
	{
		string fileName = Application.StartupPath + "\\Custom.xml";
		uiDataSet.Custom.ReadXml(fileName);
		DataRow[] array = uiDataSet.Custom.Select("[Table] = 'Custom1'");
		if (array.Length > 0)
		{
			custom1Row = array[0] as UIDataSet.CustomRow;
		}
		array = uiDataSet.Custom.Select("[Table] = 'Custom2'");
		if (array.Length > 0)
		{
			custom2Row = array[0] as UIDataSet.CustomRow;
		}
		array = uiDataSet.Custom.Select("[Table] = 'Custom3'");
		if (array.Length > 0)
		{
			custom3Row = array[0] as UIDataSet.CustomRow;
		}
		array = uiDataSet.Custom.Select("[Table] = 'Custom4'");
		if (array.Length > 0)
		{
			custom4Row = array[0] as UIDataSet.CustomRow;
		}
	}

	private void SaveCustom(StreamWriter sw, UIDataSet.CustomRow row)
	{
		string keyword = row.Keyword;
		DataTable dataTable = eCSDataSet.Tables[row._Table];
		if (clearCheckBox.Checked)
		{
			sw.WriteLine($"CLR\t{keyword}\t");
			sw.WriteLine("CLR\tEND\t");
		}
		sw.WriteLine($"DWL\t{keyword}\t");
		foreach (DataRow row2 in dataTable.Rows)
		{
			sw.Write($"{keyword}\t");
			UIDataSet.CustomItemRow[] customItemRows = row.GetCustomItemRows();
			foreach (UIDataSet.CustomItemRow customItemRow in customItemRows)
			{
				if (!(customItemRow.Field == "NULL"))
				{
					object obj = row2[customItemRow.Field];
					if (obj.GetType() == typeof(int))
					{
						sw.Write($"{obj}\t");
					}
					else if (obj.GetType() == typeof(string))
					{
						sw.Write($"{Program.FormatString(obj as string)}\t");
					}
					else if (obj.GetType() == typeof(decimal))
					{
						sw.Write($"{Program.FormatDecimal((decimal)obj, Program.DecimalFormat.None)}\t");
					}
					else
					{
						sw.Write($"\t");
					}
				}
			}
			sw.WriteLine();
		}
		sw.WriteLine($"END\t{keyword}\t");
		sw.Flush();
	}

	private void OpenCustom(UIDataSet.CustomRow row)
	{
		string keyword = row.Keyword;
		DataTable dataTable = eCSDataSet.Tables[row._Table];
		serialPort.WriteLine($"UPL\t{keyword}\t");
		while (true)
		{
			string text = serialPort.ReadLine();
			string[] array = text.Split('\t');
			if (array[0] == "END")
			{
				break;
			}
			if (array[0] != keyword)
			{
				continue;
			}
			DataRow dataRow = dataTable.NewRow();
			try
			{
				UIDataSet.CustomItemRow[] customItemRows = row.GetCustomItemRows();
				int num;
				for (int i = (num = 0); i < customItemRows.Length; i++)
				{
					string field = customItemRows[i].Field;
					if (!(field == "NULL"))
					{
						if (dataRow[field].GetType() == typeof(int))
						{
							dataRow[field] = Program.ParseInt(array[num + 1]);
						}
						else if (dataRow[field].GetType() == typeof(string))
						{
							dataRow[field] = Program.ParseString(array[num + 1]);
						}
						else if (dataRow[field].GetType() == typeof(decimal))
						{
							dataRow[field] = Program.ParseDecimal(array[num + 1]);
						}
						num++;
					}
				}
			}
			catch (IndexOutOfRangeException)
			{
			}
			dataTable.Rows.Add(dataRow);
		}
		serialPort.WriteLine("UPL\tEND\t");
	}

	private void OpenCustomRow(UIDataSet.CustomRow row, string[] items)
	{
		if (row == null)
		{
			return;
		}
		string keyword = row.Keyword;
		if (items[0] != keyword)
		{
			return;
		}
		DataTable dataTable = eCSDataSet.Tables[row._Table];
		DataRow dataRow = dataTable.NewRow();
		try
		{
			UIDataSet.CustomItemRow[] customItemRows = row.GetCustomItemRows();
			int num;
			for (int i = (num = 0); i < customItemRows.Length; i++)
			{
				string field = customItemRows[i].Field;
				if (!(field == "NULL"))
				{
					if (dataRow[field].GetType() == typeof(int))
					{
						dataRow[field] = Program.ParseInt(items[num + 1]);
					}
					else if (dataRow[field].GetType() == typeof(string))
					{
						dataRow[field] = Program.ParseString(items[num + 1]);
					}
					else if (dataRow[field].GetType() == typeof(decimal))
					{
						dataRow[field] = Program.ParseDecimal(items[num + 1]);
					}
					num++;
				}
			}
		}
		catch (IndexOutOfRangeException)
		{
		}
		dataTable.Rows.Add(dataRow);
	}

	private void DataSet_Update(string Type)
	{
		Program.mf.DataSet_Update(Type, "SaveForm");
	}

	private void ItemDefaultEnable_Change()
	{
		vipPointCheckBox.Enabled = vipCheckBox.Checked && saveButton.Checked;
		CheckBox checkBox = clearCheckBox;
		bool enabled = (bmpCheckBox.Enabled = saveButton.Checked);
		checkBox.Enabled = enabled;
		fontCheckBox.Enabled = saveButton.Checked && Program.right != Program.Right.User;
		if (openButton.Checked)
		{
			CheckBox checkBox2 = fontCheckBox;
			bool flag2 = (bmpCheckBox.Checked = false);
			checkBox2.Checked = flag2;
		}
	}

	private void ItemDefaultEnable()
	{
		specCheckBox.Enabled = Settings.Default.Enable_TMS;
		stringCheckBox.Enabled = Settings.Default.Enable_TMT;
		faceCheckBox.Enabled = Settings.Default.Enable_SCP;
		deptCheckBox.Enabled = Settings.Default.Enable_Dept;
		classCheckBox.Enabled = Settings.Default.Enable_Class;
		pLUCheckBox.Enabled = Settings.Default.Enable_PLU;
		labelCheckBox.Enabled = Settings.Default.Enable_Label;
		CheckBox checkBox = unitCheckBox;
		CheckBox checkBox2 = unitCheckBox;
		bool flag = (unitCheckBox.Checked = false);
		bool enabled = (checkBox2.Visible = flag);
		checkBox.Enabled = enabled;
		barcodeCheckBox.Enabled = Settings.Default.Enable_Barcode;
		salesmanCheckBox.Enabled = Settings.Default.Enable_Salesman;
		vipCheckBox.Enabled = Settings.Default.Enable_VIP;
		ItemDefaultEnable_Change();
	}

	private void SaveForm_Load(object sender, EventArgs e)
	{
		Text = Program.GetLang("pw_Import_Export");
		barcodeCheckBox.Text = Program.GetLang("pw_Barcode");
		bmpCheckBox.Text = Program.GetLang("pw_Bitmap");
		cancelButton.Text = Program.GetLang("pw_Cancel");
		classCheckBox.Text = Program.GetLang("pw_Class");
		clearCheckBox.Text = Program.GetLang("pw_ClearData");
		deptCheckBox.Text = Program.GetLang("pw_Dept");
		exeButton.Text = Program.GetLang("pw_Execute");
		faceCheckBox.Text = Program.GetLang("pw_Shortcutkey");
		fontCheckBox.Text = Program.GetLang("pw_Font");
		labelCheckBox.Text = Program.GetLang("pw_PrintFormat");
		openButton.Text = Program.GetLang("pw_Import_ToSoftware_");
		pLUCheckBox.Text = Program.GetLang("pw_PLU");
		wizardCheckBox.Text = Program.GetLang("pw_ConfigWizard");
		salesmanCheckBox.Text = Program.GetLang("pw_Salesman");
		saveButton.Text = Program.GetLang("pw_Export_TMSFile_");
		selAllCheckBox.Text = Program.GetLang("pw_All");
		sourceGroupBox.Text = Program.GetLang("pw_Import_Export");
		specCheckBox.Text = Program.GetLang("pw_GlobalSpec");
		stringCheckBox.Text = Program.GetLang("pw_GlobalText");
		unitCheckBox.Text = Program.GetLang("pw_Unit");
		updateCheckBox.Text = Program.GetLang("pw_BootFile");
		vipCheckBox.Text = Program.GetLang("pw_VIP");
		vipPointCheckBox.Text = Program.GetLang("pw_UpdatePoints");
		Font = Settings.Default.CustomFont;
		if (!wizardCheckBox.Checked)
		{
			ItemDefaultEnable();
		}
		selAllCheckBox.Enabled = Settings.Default.Enable_ImExport_All;
		DriveInfo[] drives = DriveInfo.GetDrives();
		driveComboBox.Items.AddRange(drives);
		driveComboBox.SelectedIndex = 0;
		DriveInfo[] array = drives;
		foreach (DriveInfo driveInfo in array)
		{
			if (driveInfo.Name == "C:\\")
			{
				driveComboBox.SelectedItem = driveInfo;
			}
			else if (driveInfo.DriveType == DriveType.Removable && driveInfo.Name != "A:\\" && driveInfo.Name != "B:\\")
			{
				driveComboBox.SelectedItem = driveInfo;
				break;
			}
		}
		string path = Application.StartupPath + "\\Binary\\Font";
		DirectoryInfo directoryInfo = new DirectoryInfo(path);
		fontComboBox.BeginUpdate();
		int selectedIndex = fontComboBox.Items.Add(Program.GetLang("pw_FontBuilder"));
		fontComboBox.SelectedIndex = selectedIndex;
		if (directoryInfo.Exists)
		{
			FileInfo[] files = directoryInfo.GetFiles("*.bin");
			foreach (FileInfo fileInfo in files)
			{
				string text = fileInfo.Name.Replace(".bin", "");
				if (text != Program.GetLang("pw_FontBuilder") && text != "")
				{
					fontComboBox.Items.Add(text);
				}
			}
		}
		fontComboBox.EndUpdate();
		fontComboBox.Visible = fontComboBox.Items.Count > 1;
		GenerateFileName();
		serialComboBox.Items.AddRange(SerialPort.GetPortNames());
		serialComboBox.SelectedIndex = ((serialComboBox.Items.Count <= 0) ? (-1) : 0);
		baudComboBox.SelectedItem = Settings.Default.serailBaudRate.ToString();
		FindCustom();
		if (custom1Row == null)
		{
			custom1CheckBox.Visible = false;
		}
		else
		{
			custom1CheckBox.Visible = custom1Row.Visible;
			custom1CheckBox.Text = custom1Row.Display;
		}
		if (custom2Row == null)
		{
			custom2CheckBox.Visible = false;
		}
		else
		{
			custom2CheckBox.Visible = custom2Row.Visible;
			custom2CheckBox.Text = custom2Row.Display;
		}
		if (custom3Row == null)
		{
			custom3CheckBox.Visible = false;
		}
		else
		{
			custom3CheckBox.Visible = custom3Row.Visible;
			custom3CheckBox.Text = custom3Row.Display;
		}
		if (custom4Row == null)
		{
			custom4CheckBox.Visible = false;
		}
		else
		{
			custom4CheckBox.Visible = custom4Row.Visible;
			custom4CheckBox.Text = custom4Row.Display;
		}
		faceListTableAdapter.Fill(eCSDataSet.FaceList);
		faceListComboBox.SelectedValue = Settings.Default.ScFile_ScaleID;
		if (faceListComboBox.SelectedIndex == -1)
		{
			faceListComboBox.SelectedIndex = 0;
		}
	}

	private void browseButton_Click(object sender, EventArgs e)
	{
		SaveFileDialog saveFileDialog = new SaveFileDialog();
		saveFileDialog.OverwritePrompt = false;
		saveFileDialog.CheckFileExists = false;
		saveFileDialog.Filter = Program.GetLang("pw_TMSFile___TMS____tms_AllFile_________");
		saveFileDialog.FileName = filenameTextBox.Text;
		if (saveFileDialog.ShowDialog(this) == DialogResult.OK)
		{
			filenameTextBox.Text = saveFileDialog.FileName;
		}
	}

	private void customRadioButton_CheckedChanged(object sender, EventArgs e)
	{
		TextBox textBox = filenameTextBox;
		bool enabled = (browseButton.Enabled = customRadioButton.Checked);
		textBox.Enabled = enabled;
		ComboBox comboBox = driveComboBox;
		NumericUpDown obj = numericUpDown;
		bool flag2 = (updateCheckBox.Enabled = generateRadioButton.Checked);
		bool enabled2 = (obj.Enabled = flag2);
		comboBox.Enabled = enabled2;
		ComboBox comboBox2 = baudComboBox;
		bool enabled3 = (serialComboBox.Enabled = serialRadioButton.Checked);
		comboBox2.Enabled = enabled3;
		if (generateRadioButton.Checked)
		{
			GenerateFileName();
		}
	}

	private void driveComboBox_SelectedIndexChanged(object sender, EventArgs e)
	{
		GenerateFileName();
	}

	private void updateCheckBox_CheckedChanged(object sender, EventArgs e)
	{
		numericUpDown.Enabled = !updateCheckBox.Checked;
		GenerateFileName();
	}

	private void selAllCheckBox_CheckedChanged(object sender, EventArgs e)
	{
		if (specCheckBox.Enabled)
		{
			specCheckBox.Checked = selAllCheckBox.Checked;
		}
		if (stringCheckBox.Enabled)
		{
			stringCheckBox.Checked = selAllCheckBox.Checked;
		}
		if (faceCheckBox.Enabled)
		{
			faceCheckBox.Checked = selAllCheckBox.Checked;
		}
		if (deptCheckBox.Enabled)
		{
			deptCheckBox.Checked = selAllCheckBox.Checked;
		}
		if (classCheckBox.Enabled)
		{
			classCheckBox.Checked = selAllCheckBox.Checked;
		}
		if (pLUCheckBox.Enabled)
		{
			pLUCheckBox.Checked = selAllCheckBox.Checked;
		}
		if (labelCheckBox.Enabled)
		{
			labelCheckBox.Checked = selAllCheckBox.Checked;
		}
		if (unitCheckBox.Enabled)
		{
			unitCheckBox.Checked = selAllCheckBox.Checked;
		}
		if (barcodeCheckBox.Enabled)
		{
			barcodeCheckBox.Checked = selAllCheckBox.Checked;
		}
		if (salesmanCheckBox.Enabled)
		{
			salesmanCheckBox.Checked = selAllCheckBox.Checked;
		}
		if (custom1CheckBox.Enabled && custom1CheckBox.Visible)
		{
			custom1CheckBox.Checked = selAllCheckBox.Checked;
		}
		if (custom2CheckBox.Enabled && custom2CheckBox.Visible)
		{
			custom2CheckBox.Checked = selAllCheckBox.Checked;
		}
		if (custom3CheckBox.Enabled && custom3CheckBox.Visible)
		{
			custom3CheckBox.Checked = selAllCheckBox.Checked;
		}
		if (custom4CheckBox.Enabled && custom4CheckBox.Visible)
		{
			custom4CheckBox.Checked = selAllCheckBox.Checked;
		}
		if (!selAllCheckBox.Checked)
		{
			CheckBox checkBox = vipCheckBox;
			CheckBox checkBox2 = fontCheckBox;
			bool flag = (bmpCheckBox.Checked = false);
			bool flag3 = (checkBox2.Checked = flag);
			checkBox.Checked = flag3;
		}
	}

	private void SaveToFile()
	{
		string text = filenameTextBox.Text;
		if (string.IsNullOrEmpty(text))
		{
			return;
		}
		bool flag = false;
		string text2 = Application.StartupPath + "\\Tm-xA.tmp";
		try
		{
			Cursor.Current = Cursors.WaitCursor;
			string directoryName = Path.GetDirectoryName(text);
			if (!Directory.Exists(directoryName))
			{
				Directory.CreateDirectory(directoryName);
			}
			StreamWriter streamWriter = new StreamWriter(text2, append: false, Program.GetEncoding());
			streamWriter.WriteLine();
			streamWriter.WriteLine("ECS\tVER\t100\t");
			if (specCheckBox.Checked)
			{
				if (clearCheckBox.Checked)
				{
					streamWriter.WriteLine("CLR\tTMS\t");
					streamWriter.WriteLine("CLR\tEND\t");
				}
				specTableAdapter.Fill(eCSDataSet.Spec);
				streamWriter.WriteLine("DWL\tTMS\t");
				foreach (ECSDataSet.SpecRow item in eCSDataSet.Spec)
				{
					if (item.Valid)
					{
						streamWriter.WriteLine("TMS\t{0}\t{1}\t", item.SpecID, item.Value);
					}
				}
				streamWriter.WriteLine("END\tTMS\t");
			}
			if (stringCheckBox.Checked)
			{
				if (clearCheckBox.Checked)
				{
					streamWriter.WriteLine("CLR\tTMT\t");
					streamWriter.WriteLine("CLR\tEND\t");
				}
				stringTableAdapter.Fill(eCSDataSet.String);
				streamWriter.WriteLine("DWL\tTMT\t");
				foreach (ECSDataSet.StringRow item2 in eCSDataSet.String)
				{
					if (item2.Valid)
					{
						if (item2.StringID == 15 && Program.GetEncoding() != Encoding.UTF8)
						{
							streamWriter.Dispose();
							streamWriter = new StreamWriter(text2, append: true, Encoding.UTF8);
							streamWriter.WriteLine("TMT\t{0}\t{1}\t", item2.StringID, item2.Value);
							streamWriter.Dispose();
							streamWriter = new StreamWriter(text2, append: true, Program.GetEncoding());
						}
						else
						{
							streamWriter.WriteLine("TMT\t{0}\t{1}\t", item2.StringID, item2.Value);
						}
					}
				}
				streamWriter.WriteLine("END\tTMT\t");
			}
			if (faceCheckBox.Checked)
			{
				object selectedValue = faceListComboBox.SelectedValue;
				faceListTableAdapter.Fill(eCSDataSet.FaceList);
				faceTableAdapter.Fill(eCSDataSet.Face);
				faceListComboBox.SelectedValue = selectedValue;
				streamWriter.WriteLine("DWL\tSCP\t");
				foreach (ECSDataSet.FaceRow item3 in eCSDataSet.Face)
				{
					if (item3.ScaleID == (string)faceListComboBox.SelectedValue && (clearCheckBox.Checked || item3.PLUID != 0))
					{
						streamWriter.WriteLine("SCP\t{0}\t{1}\t{2}\t", item3.PageID, item3.KeyID, item3.PLUID);
					}
				}
				streamWriter.WriteLine("END\tSCP\t");
			}
			if (deptCheckBox.Checked)
			{
				if (clearCheckBox.Checked)
				{
					streamWriter.WriteLine("CLR\tDPT\t");
					streamWriter.WriteLine("CLR\tEND\t");
				}
				deptTableAdapter.Fill(eCSDataSet.Dept);
				streamWriter.WriteLine("DWL\tDPT\t");
				DataRow[] array = eCSDataSet.Dept.Select(flag ? ("DeptID >=  " + Settings.Default.minUserDeptID) : string.Empty);
				for (int i = 0; i < array.Length; i++)
				{
					ECSDataSet.DeptRow deptRow = (ECSDataSet.DeptRow)array[i];
					streamWriter.WriteLine("DPT\t{0}\t{1}\t", deptRow.DeptID, deptRow.Name);
				}
				streamWriter.WriteLine("END\tDPT\t");
			}
			if (classCheckBox.Checked)
			{
				if (clearCheckBox.Checked)
				{
					streamWriter.WriteLine("CLR\tCLS\t");
					streamWriter.WriteLine("CLR\tEND\t");
				}
				classTableAdapter.Fill(eCSDataSet.Class);
				streamWriter.WriteLine("DWL\tCLS\t");
				DataRow[] array2 = eCSDataSet.Class.Select(flag ? ("ClassID >=  " + Settings.Default.minUserClassID) : string.Empty);
				for (int j = 0; j < array2.Length; j++)
				{
					ECSDataSet.ClassRow classRow = (ECSDataSet.ClassRow)array2[j];
					streamWriter.WriteLine("CLS\t{0}\t{1}\t{2}\t{3}\t{4}\t{5}\t{6}\t{7}\t{8}\t", classRow.ClassID, classRow.Name, classRow.DeptID, classRow.LabelID1, classRow.BarT1, classRow.BarF1, classRow.LabelID2, classRow.BarT2, classRow.BarF2);
				}
				streamWriter.WriteLine("END\tCLS\t");
			}
			if (pLUCheckBox.Checked)
			{
				if (clearCheckBox.Checked)
				{
					streamWriter.WriteLine("CLR\tPLU\t");
					streamWriter.WriteLine("CLR\tEND\t");
				}
				pLUTableAdapter.Fill(eCSDataSet.PLU);
				streamWriter.WriteLine("DWL\tPLU\t");
				DataRow[] array3 = eCSDataSet.PLU.Select(flag ? ("PLUID >=  " + Settings.Default.minUserPLUID) : string.Empty);
				for (int k = 0; k < array3.Length; k++)
				{
					ECSDataSet.PLURow pLURow = (ECSDataSet.PLURow)array3[k];
					if (pLUCheckBox.CheckState == CheckState.Checked || pLURow.Valid)
					{
						streamWriter.WriteLine("PLU\t{0}\t{1}\t{2}\t{3}\t{4}\t{5}\t{6}\t{7}\t{8}\t{9}\t{10}\t{11}\t{12}\t{13}\t{14}\t{15}\t{16}\t{17}\t{18}\t{19}\t{20}\t{21}\t{22}\t{23}\t{24}\t{25}\t{26}\t{27}\t{28}\t{29}\t{30}\t{31}\t{32}\t{33}\t{34}\t{35}\t{36}\t{37}\t{38}\t{39}\t{40}\t{41}\t{42}\t{43}\t{44}\t{45}\t{46}\t{47}\t{48}\t{49}\t{50}\t{51}\t{52}\t{53}\t{54}\t{55}\t{56}\t{57}\t{58}\t{59}\t{60}\t{61}\t{62}\t{63}\t{64}\t{65}\t{66}\t", pLURow.PLUID, pLURow.Remark, pLURow.Index, pLURow.UnitID, Program.FormatDecimal(pLURow.Price, Program.DecimalFormat.Price), Program.FormatDecimal(pLURow.Cost, Program.DecimalFormat.Price), Program.FormatDecimal(pLURow.Tare, Program.DecimalFormat.Weight), pLURow.LabelID1, pLURow.BarT1, pLURow.BarF1, pLURow.LabelID2, pLURow.BarT2, pLURow.BarF2, pLURow.ClassID, Program.FormatString(pLURow.Name), Program.FormatString(pLURow.Text1), Program.FormatString(pLURow.Text2), Program.FormatString(pLURow.Text3), Program.FormatString(pLURow.Text4), Program.FormatString(pLURow.Text5), Program.FormatString(pLURow.Text6), Program.FormatString(pLURow.Text7), pLURow.PS_SD, pLURow.PS_ST, pLURow.PS_PD, pLURow.PS_PT, pLURow.PS_UD, pLURow.PC_SD, pLURow.PC_ST, pLURow.PC_PD, pLURow.PC_PT, pLURow.PC_UD, pLURow.DF_D, pLURow.DF_U, Program.FormatDecimal(pLURow.DF_DN, Program.DecimalFormat.Weight), Program.FormatDecimal(pLURow.DF_UN, Program.DecimalFormat.Weight), pLURow.DA_Sort1, pLURow.DA_Day1, Program.FormatDecimal(pLURow.DA_Dn1, Program.DecimalFormat.Weight), Program.FormatDecimal(pLURow.DA_Up1, Program.DecimalFormat.Weight), Program.FormatDecimal(pLURow.DA_Num1, Program.DecimalFormat.Price), pLURow.DA_Sort2, pLURow.DA_Day2, Program.FormatDecimal(pLURow.DA_Dn2, Program.DecimalFormat.Weight), Program.FormatDecimal(pLURow.DA_Up2, Program.DecimalFormat.Weight), Program.FormatDecimal(pLURow.DA_Num2, Program.DecimalFormat.Price), pLURow.DA_Sort3, pLURow.DA_Day3, Program.FormatDecimal(pLURow.DA_Dn3, Program.DecimalFormat.Weight), Program.FormatDecimal(pLURow.DA_Up3, Program.DecimalFormat.Weight), Program.FormatDecimal(pLURow.DA_Num3, Program.DecimalFormat.Price), pLURow.DA_Sort4, pLURow.DA_Day4, Program.FormatDecimal(pLURow.DA_Dn4, Program.DecimalFormat.Weight), Program.FormatDecimal(pLURow.DA_Up4, Program.DecimalFormat.Weight), Program.FormatDecimal(pLURow.DA_Num4, Program.DecimalFormat.Price), pLURow.TaxType, pLURow.Tax, pLURow.SspValue1, pLURow.SspValue2, pLURow.SspValue3, pLURow.SspValue4, pLURow.SType, pLURow.ALPHA, pLURow.Flag, pLURow.Flag_Value, pLURow.Bitmap);
					}
				}
				streamWriter.WriteLine("END\tPLU\t");
			}
			if (barcodeCheckBox.Checked)
			{
				if (clearCheckBox.Checked)
				{
					streamWriter.WriteLine("CLR\tBAR\t");
					streamWriter.WriteLine("CLR\tEND\t");
				}
				barcodeTableAdapter.Fill(eCSDataSet.Barcode);
				streamWriter.WriteLine("DWL\tBAR\t");
				DataRow[] array4 = eCSDataSet.Barcode.Select(flag ? ("BarID >=  " + Settings.Default.minUserBarcodeID) : string.Empty);
				for (int l = 0; l < array4.Length; l++)
				{
					ECSDataSet.BarcodeRow barcodeRow = (ECSDataSet.BarcodeRow)array4[l];
					streamWriter.WriteLine("BAR\t{0}\t{1}\t{2}\t{3}\t{4}\t{5}\t{6}\t", barcodeRow.BarID, barcodeRow.Name, barcodeRow.Format, barcodeRow.Check, barcodeRow.Num1, barcodeRow.Num2, barcodeRow.TChar);
				}
				streamWriter.WriteLine("END\tBAR\t");
			}
			if (labelCheckBox.Checked)
			{
				if (clearCheckBox.Checked)
				{
					streamWriter.WriteLine("CLR\tLAB\t");
					streamWriter.WriteLine("CLR\tEND\t");
				}
				labelTableAdapter.Fill(eCSDataSet.Label);
				labelItemTableAdapter.Fill(eCSDataSet.LabelItem);
				streamWriter.WriteLine("DWL\tLAB\t");
				string filterExpression = ((Program.right == Program.Right.SuperAdmin) ? "" : ("LabelID >=  " + Settings.Default.minUserLabelID + " AND LabelID <= " + Settings.Default.maxLabelID));
				DataRow[] array5 = eCSDataSet.Label.Select(filterExpression);
				for (int m = 0; m < array5.Length; m++)
				{
					ECSDataSet.LabelRow labelRow = (ECSDataSet.LabelRow)array5[m];
					streamWriter.WriteLine("LAB\t{0}\t{1}\t{2}\t{3}\t{4}\t{5}\t{6}\t{7}\t{8}\t{9}\t{10}\t{11}\t{12}\t{13}\t{14}\t{15}\t{16}\t{17}\t{18}\t{19}\t{20}\t{21}\t{22}\t{23}\t{24}\t{25}\t{26}\t{27}\t{28}\t{29}\t{30}\t{31}\t{32}\t{33}\t{34}\t{35}\t{36}\t{37}\t", labelRow.LabelID, labelRow.Name, labelRow.Sort, labelRow.Width / 8, labelRow.Height / 8, Program.FormatString(labelRow.Text1), Program.FormatString(labelRow.Text2), Program.FormatString(labelRow.Text3), Program.FormatString(labelRow.Text4), Program.FormatString(labelRow.Text5), Program.FormatString(labelRow.Text6), Program.FormatString(labelRow.Text7), Program.FormatString(labelRow.Text8), Program.FormatString(labelRow.Text9), Program.FormatString(labelRow.Text10), Program.FormatString(labelRow.Text11), Program.FormatString(labelRow.Text12), Program.FormatString(labelRow.Text13), Program.FormatString(labelRow.Text14), Program.FormatString(labelRow.Text15), Program.FormatString(labelRow.Text16), labelRow.Version, Program.FormatString(labelRow.Text17), Program.FormatString(labelRow.Text18), Program.FormatString(labelRow.Text19), Program.FormatString(labelRow.Text20), Program.FormatString(labelRow.Text21), Program.FormatString(labelRow.Text22), Program.FormatString(labelRow.Text23), Program.FormatString(labelRow.Text24), Program.FormatString(labelRow.Text25), Program.FormatString(labelRow.Text26), Program.FormatString(labelRow.Text27), Program.FormatString(labelRow.Text28), Program.FormatString(labelRow.Text29), Program.FormatString(labelRow.Text30), Program.FormatString(labelRow.Text31), Program.FormatString(labelRow.Text32));
					ECSDataSet.LabelItemRow[] labelItemRows = labelRow.GetLabelItemRows();
					foreach (ECSDataSet.LabelItemRow labelItemRow in labelItemRows)
					{
						streamWriter.WriteLine("LAS\t{0}\t{1}\t{2}\t{3}\t{4}\t{5}\t{6}\t{7}\t{8}\t{9}\t{10}\t{11}\t", labelItemRow.SubID, labelItemRow.Flag1, labelItemRow.Flag2, labelItemRow.Flag3, labelItemRow.Print, labelItemRow.Angle, labelItemRow.Align, labelItemRow.Font, labelItemRow.Left, labelItemRow.Top, labelItemRow.Width, labelItemRow.Height);
					}
					streamWriter.WriteLine("LAE\t");
				}
				streamWriter.WriteLine("END\tLAB\t");
			}
			if (salesmanCheckBox.Checked)
			{
				if (clearCheckBox.Checked)
				{
					streamWriter.WriteLine("CLR\tSAL\t");
					streamWriter.WriteLine("CLR\tEND\t");
				}
				salesmanTableAdapter.Fill(eCSDataSet.Salesman);
				streamWriter.WriteLine("DWL\tSAL\t");
				DataRow[] array6 = eCSDataSet.Salesman.Select(flag ? ("SalesmanID >=  " + Settings.Default.minUserSalesmanID) : string.Empty);
				for (int num = 0; num < array6.Length; num++)
				{
					ECSDataSet.SalesmanRow salesmanRow = (ECSDataSet.SalesmanRow)array6[num];
					streamWriter.WriteLine("SAL\t{0}\t{1}\t{2}\t{3}\t{4}\t{5}\t{6}\t", salesmanRow.SalesmanID, salesmanRow.Name, salesmanRow.Password, salesmanRow.Discount_Low, salesmanRow.Discount_High, salesmanRow.RightFB, salesmanRow.Code);
				}
				streamWriter.WriteLine("END\tSAL\t");
			}
			if (fontCheckBox.Checked)
			{
				string path = ((fontComboBox.SelectedIndex != 0) ? (Application.StartupPath + "\\binary\\Font\\" + (string)fontComboBox.SelectedItem + ".bin") : (Application.StartupPath + "\\binary\\Font.bin"));
				if (File.Exists(path))
				{
					streamWriter.WriteLine("DWL\tFNT\t");
					streamWriter.Write("FNT\t");
					byte[] array7 = File.ReadAllBytes(path);
					byte[] array8 = array7;
					foreach (byte b in array8)
					{
						char value = (char)(64 + b / 16);
						char value2 = (char)(64 + b % 16);
						streamWriter.Write(value);
						streamWriter.Write(value2);
					}
					streamWriter.WriteLine("\t");
					streamWriter.WriteLine("END\tFNT\t");
				}
			}
			if (bmpCheckBox.Checked)
			{
				if (clearCheckBox.Checked)
				{
					streamWriter.WriteLine("CLR\tBMP\t");
					streamWriter.WriteLine("CLR\tEND\t");
				}
				List<SinglePicture> lsp = new List<SinglePicture>();
				BitmapFuc.DataSet_Bitmap_Load(ref lsp, ref eCSDataSet);
				streamWriter.WriteLine("DWL\tBMP\t");
				for (int num2 = 0; num2 < eCSDataSet.Bitmap.Count; num2++)
				{
					ECSDataSet.BitmapRow bitmapRow = eCSDataSet.Bitmap[num2];
					string st = "";
					Program.getByte_multi((uint)bitmapRow.ID, ref st, 4);
					Program.getByte_multi((uint)((Image)bitmapRow.Picture).Size.Width, ref st, 2);
					Program.getByte_multi((uint)((Image)bitmapRow.Picture).Size.Height, ref st, 2);
					for (int num3 = 0; num3 < 22; num3++)
					{
						Program.getByte_multi(0u, ref st, 4);
					}
					st += bitmapRow.PicString;
					streamWriter.WriteLine("BMP\t{0}\t{1}\t", bitmapRow.ID, st);
				}
				streamWriter.WriteLine("END\tBMP\t");
			}
			if (vipCheckBox.Checked)
			{
				if (clearCheckBox.Checked)
				{
					streamWriter.WriteLine("CLR\tVIP\t");
					streamWriter.WriteLine("CLR\tEND\t");
				}
				vipTableAdapter.Fill(eCSDataSet.VIP);
				streamWriter.WriteLine("DWL\tVIP\t");
				foreach (ECSDataSet.VIPRow item4 in eCSDataSet.VIP)
				{
					long num4 = Convert.ToInt64(item4.BAR);
					long num5;
					try
					{
						num5 = Convert.ToInt64(item4.PH);
					}
					catch (Exception)
					{
						num5 = 0L;
					}
					decimal d = -1m;
					if (vipPointCheckBox.Checked)
					{
						d = item4.Point;
					}
					streamWriter.WriteLine("VIP\t{0}\t{1}\t{2}\t{3}\t{4}\t{5}\t", num4 / 1000000000, num4 % 1000000000, num5 / 1000000000, num5 % 1000000000, Program.FormatDecimal(d, Program.DecimalFormat.Price), item4.Discount);
				}
				streamWriter.WriteLine("END\tVIP\t");
			}
			if (custom1CheckBox.Checked)
			{
				custom1TableAdapter.Fill(eCSDataSet.Custom1);
				SaveCustom(streamWriter, custom1Row);
			}
			if (custom2CheckBox.Checked)
			{
				custom2TableAdapter.Fill(eCSDataSet.Custom2);
				SaveCustom(streamWriter, custom2Row);
			}
			if (custom3CheckBox.Checked)
			{
				custom3TableAdapter.Fill(eCSDataSet.Custom3);
				SaveCustom(streamWriter, custom3Row);
			}
			if (custom4CheckBox.Checked)
			{
				custom4TableAdapter.Fill(eCSDataSet.Custom4);
				SaveCustom(streamWriter, custom4Row);
			}
			if (wizardCheckBox.Checked)
			{
				streamWriter.Write(Program.sWizard);
			}
			streamWriter.WriteLine("END\tECS\t");
			streamWriter.Dispose();
			File.Copy(text2, text, overwrite: true);
			MessageBox.Show(this, Program.GetLang("pw_OperationSuccess"), Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Asterisk);
			base.DialogResult = DialogResult.OK;
		}
		catch (Exception ex2)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex2.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
		}
		finally
		{
			File.Delete(text2);
			Cursor.Current = Cursors.Default;
		}
	}

	private void SaveToSerial()
	{
		bool flag = false;
		eCSDataSet.Clear();
		try
		{
			Cursor.Current = Cursors.WaitCursor;
			if (int.TryParse(baudComboBox.Text, out var result))
			{
				Settings.Default.serailBaudRate = result;
				Settings.Default.Save();
				serialPort.BaudRate = result;
			}
			else
			{
				result = Settings.Default.serailBaudRate;
			}
			serialPort.PortName = serialComboBox.Text;
			serialPort.Encoding = Program.GetEncoding();
			serialPort.NewLine = Environment.NewLine;
			serialPort.Open();
			serialPort.WriteLine("UPL\tTIM\t");
			DateTime dateTime = DateTime.Now.AddSeconds(3.0);
			while (true)
			{
				int bytesToRead = serialPort.BytesToRead;
				if (bytesToRead > 10)
				{
					break;
				}
				if (DateTime.Now >= dateTime)
				{
					throw new TimeoutException();
				}
			}
			string[] array;
			do
			{
				string empty = string.Empty;
				empty = serialPort.ReadLine();
				array = empty.Split('\t');
			}
			while (!(array[0] == "END"));
			serialPort.WriteLine("UPL\tEND\t");
			StreamWriter streamWriter = new StreamWriter(serialPort.BaseStream, Program.GetEncoding());
			streamWriter.AutoFlush = true;
			streamWriter.WriteLine();
			if (specCheckBox.Checked)
			{
				if (clearCheckBox.Checked)
				{
					streamWriter.WriteLine("CLR\tTMS\t");
					streamWriter.WriteLine("CLR\tEND\t");
				}
				specTableAdapter.Fill(eCSDataSet.Spec);
				streamWriter.WriteLine("DWL\tTMS\t");
				foreach (ECSDataSet.SpecRow item in eCSDataSet.Spec)
				{
					if (item.Valid)
					{
						streamWriter.WriteLine("TMS\t{0}\t{1}\t", item.SpecID, item.Value);
					}
				}
				streamWriter.WriteLine("END\tTMS\t");
			}
			if (stringCheckBox.Checked)
			{
				if (clearCheckBox.Checked)
				{
					streamWriter.WriteLine("CLR\tTMT\t");
					streamWriter.WriteLine("CLR\tEND\t");
				}
				stringTableAdapter.Fill(eCSDataSet.String);
				streamWriter.WriteLine("DWL\tTMT\t");
				foreach (ECSDataSet.StringRow item2 in eCSDataSet.String)
				{
					if (item2.Valid)
					{
						if (item2.StringID == 15 && Program.GetEncoding() != Encoding.UTF8)
						{
							streamWriter.Dispose();
							streamWriter = new StreamWriter(serialPort.BaseStream, Encoding.UTF8);
							streamWriter.WriteLine("TMT\t{0}\t{1}\t", item2.StringID, item2.Value);
							streamWriter.Dispose();
							streamWriter = new StreamWriter(serialPort.BaseStream, Program.GetEncoding());
						}
						else
						{
							streamWriter.WriteLine("TMT\t{0}\t{1}\t", item2.StringID, item2.Value);
						}
					}
				}
				streamWriter.WriteLine("END\tTMT\t");
			}
			if (faceCheckBox.Checked)
			{
				if (clearCheckBox.Checked)
				{
					streamWriter.WriteLine("CLR\tSCP\t");
					streamWriter.WriteLine("CLR\tEND\t");
				}
				faceListTableAdapter.Fill(eCSDataSet.FaceList);
				faceTableAdapter.Fill(eCSDataSet.Face);
				streamWriter.WriteLine("DWL\tSCP\t");
				foreach (ECSDataSet.FaceRow item3 in eCSDataSet.Face)
				{
					if (item3.ScaleID == (string)faceListComboBox.SelectedValue && (clearCheckBox.Checked || item3.PLUID != 0))
					{
						streamWriter.WriteLine("SCP\t{0}\t{1}\t{2}\t", item3.PageID, item3.KeyID, item3.PLUID);
					}
				}
				streamWriter.WriteLine("END\tSCP\t");
			}
			if (deptCheckBox.Checked)
			{
				if (clearCheckBox.Checked)
				{
					streamWriter.WriteLine("CLR\tDPT\t");
					streamWriter.WriteLine("CLR\tEND\t");
				}
				deptTableAdapter.Fill(eCSDataSet.Dept);
				streamWriter.WriteLine("DWL\tDPT\t");
				DataRow[] array2 = eCSDataSet.Dept.Select(flag ? ("DeptID >=  " + Settings.Default.minUserDeptID) : string.Empty);
				for (int i = 0; i < array2.Length; i++)
				{
					ECSDataSet.DeptRow deptRow = (ECSDataSet.DeptRow)array2[i];
					streamWriter.WriteLine("DPT\t{0}\t{1}\t", deptRow.DeptID, deptRow.Name);
				}
				streamWriter.WriteLine("END\tDPT\t");
			}
			if (classCheckBox.Checked)
			{
				if (clearCheckBox.Checked)
				{
					streamWriter.WriteLine("CLR\tCLS\t");
					streamWriter.WriteLine("CLR\tEND\t");
				}
				classTableAdapter.Fill(eCSDataSet.Class);
				streamWriter.WriteLine("DWL\tCLS\t");
				DataRow[] array3 = eCSDataSet.Class.Select(flag ? ("ClassID >=  " + Settings.Default.minUserClassID) : string.Empty);
				for (int j = 0; j < array3.Length; j++)
				{
					ECSDataSet.ClassRow classRow = (ECSDataSet.ClassRow)array3[j];
					streamWriter.WriteLine("CLS\t{0}\t{1}\t{2}\t{3}\t{4}\t{5}\t{6}\t{7}\t{8}\t", classRow.ClassID, classRow.Name, classRow.DeptID, classRow.LabelID1, classRow.BarT1, classRow.BarF1, classRow.LabelID2, classRow.BarT2, classRow.BarF2);
				}
				streamWriter.WriteLine("END\tCLS\t");
			}
			if (pLUCheckBox.Checked)
			{
				if (clearCheckBox.Checked)
				{
					streamWriter.WriteLine("CLR\tPLU\t");
					streamWriter.WriteLine("CLR\tEND\t");
				}
				pLUTableAdapter.Fill(eCSDataSet.PLU);
				streamWriter.WriteLine("DWL\tPLU\t");
				DataRow[] array4 = eCSDataSet.PLU.Select(flag ? ("PLUID >=  " + Settings.Default.minUserPLUID) : string.Empty);
				for (int k = 0; k < array4.Length; k++)
				{
					ECSDataSet.PLURow pLURow = (ECSDataSet.PLURow)array4[k];
					if (pLUCheckBox.CheckState == CheckState.Checked || pLURow.Valid)
					{
						streamWriter.WriteLine("PLU\t{0}\t{1}\t{2}\t{3}\t{4}\t{5}\t{6}\t{7}\t{8}\t{9}\t{10}\t{11}\t{12}\t{13}\t{14}\t{15}\t{16}\t{17}\t{18}\t{19}\t{20}\t{21}\t{22}\t{23}\t{24}\t{25}\t{26}\t{27}\t{28}\t{29}\t{30}\t{31}\t{32}\t{33}\t{34}\t{35}\t{36}\t{37}\t{38}\t{39}\t{40}\t{41}\t{42}\t{43}\t{44}\t{45}\t{46}\t{47}\t{48}\t{49}\t{50}\t{51}\t{52}\t{53}\t{54}\t{55}\t{56}\t{57}\t{58}\t{59}\t{60}\t{61}\t{62}\t{63}\t{64}\t{65}\t{66}\t", pLURow.PLUID, pLURow.Remark, pLURow.Index, pLURow.UnitID, Program.FormatDecimal(pLURow.Price, Program.DecimalFormat.Price), Program.FormatDecimal(pLURow.Cost, Program.DecimalFormat.Price), Program.FormatDecimal(pLURow.Tare, Program.DecimalFormat.Weight), pLURow.LabelID1, pLURow.BarT1, pLURow.BarF1, pLURow.LabelID2, pLURow.BarT2, pLURow.BarF2, pLURow.ClassID, Program.FormatString(pLURow.Name), Program.FormatString(pLURow.Text1), Program.FormatString(pLURow.Text2), Program.FormatString(pLURow.Text3), Program.FormatString(pLURow.Text4), Program.FormatString(pLURow.Text5), Program.FormatString(pLURow.Text6), Program.FormatString(pLURow.Text7), pLURow.PS_SD, pLURow.PS_ST, pLURow.PS_PD, pLURow.PS_PT, pLURow.PS_UD, pLURow.PC_SD, pLURow.PC_ST, pLURow.PC_PD, pLURow.PC_PT, pLURow.PC_UD, pLURow.DF_D, pLURow.DF_U, Program.FormatDecimal(pLURow.DF_DN, Program.DecimalFormat.Weight), Program.FormatDecimal(pLURow.DF_UN, Program.DecimalFormat.Weight), pLURow.DA_Sort1, pLURow.DA_Day1, Program.FormatDecimal(pLURow.DA_Dn1, Program.DecimalFormat.Weight), Program.FormatDecimal(pLURow.DA_Up1, Program.DecimalFormat.Weight), Program.FormatDecimal(pLURow.DA_Num1, Program.DecimalFormat.Price), pLURow.DA_Sort2, pLURow.DA_Day2, Program.FormatDecimal(pLURow.DA_Dn2, Program.DecimalFormat.Weight), Program.FormatDecimal(pLURow.DA_Up2, Program.DecimalFormat.Weight), Program.FormatDecimal(pLURow.DA_Num2, Program.DecimalFormat.Price), pLURow.DA_Sort3, pLURow.DA_Day3, Program.FormatDecimal(pLURow.DA_Dn3, Program.DecimalFormat.Weight), Program.FormatDecimal(pLURow.DA_Up3, Program.DecimalFormat.Weight), Program.FormatDecimal(pLURow.DA_Num3, Program.DecimalFormat.Price), pLURow.DA_Sort4, pLURow.DA_Day4, Program.FormatDecimal(pLURow.DA_Dn4, Program.DecimalFormat.Weight), Program.FormatDecimal(pLURow.DA_Up4, Program.DecimalFormat.Weight), Program.FormatDecimal(pLURow.DA_Num4, Program.DecimalFormat.Price), pLURow.TaxType, pLURow.Tax, pLURow.SspValue1, pLURow.SspValue2, pLURow.SspValue3, pLURow.SspValue4, pLURow.SType, pLURow.ALPHA, pLURow.Flag, pLURow.Flag_Value, pLURow.Bitmap);
					}
				}
				streamWriter.WriteLine("END\tPLU\t");
			}
			if (barcodeCheckBox.Checked)
			{
				if (clearCheckBox.Checked)
				{
					streamWriter.WriteLine("CLR\tBAR\t");
					streamWriter.WriteLine("CLR\tEND\t");
				}
				barcodeTableAdapter.Fill(eCSDataSet.Barcode);
				streamWriter.WriteLine("DWL\tBAR\t");
				DataRow[] array5 = eCSDataSet.Barcode.Select(flag ? ("BarID >=  " + Settings.Default.minUserBarcodeID) : string.Empty);
				for (int l = 0; l < array5.Length; l++)
				{
					ECSDataSet.BarcodeRow barcodeRow = (ECSDataSet.BarcodeRow)array5[l];
					streamWriter.WriteLine("BAR\t{0}\t{1}\t{2}\t{3}\t{4}\t{5}\t{6}\t", barcodeRow.BarID, barcodeRow.Name, barcodeRow.Format, barcodeRow.Check, barcodeRow.Num1, barcodeRow.Num2, barcodeRow.TChar);
				}
				streamWriter.WriteLine("END\tBAR\t");
			}
			if (labelCheckBox.Checked)
			{
				if (clearCheckBox.Checked)
				{
					streamWriter.WriteLine("CLR\tLAB\t");
					streamWriter.WriteLine("CLR\tEND\t");
				}
				labelTableAdapter.Fill(eCSDataSet.Label);
				labelItemTableAdapter.Fill(eCSDataSet.LabelItem);
				streamWriter.WriteLine("DWL\tLAB\t");
				DataRow[] array6 = eCSDataSet.Label.Select("LabelID >=  " + Settings.Default.minUserLabelID + " AND LabelID <= " + Settings.Default.maxLabelID);
				for (int m = 0; m < array6.Length; m++)
				{
					ECSDataSet.LabelRow labelRow = (ECSDataSet.LabelRow)array6[m];
					streamWriter.WriteLine("LAB\t{0}\t{1}\t{2}\t{3}\t{4}\t{5}\t{6}\t{7}\t{8}\t{9}\t{10}\t{11}\t{12}\t{13}\t{14}\t{15}\t{16}\t{17}\t{18}\t{19}\t{20}\t{21}\t{22}\t{23}\t{24}\t{25}\t{26}\t{27}\t{28}\t{29}\t{30}\t{31}\t{32}\t{33}\t{34}\t{35}\t{36}\t{37}\t", labelRow.LabelID, labelRow.Name, labelRow.Sort, labelRow.Width / 8, labelRow.Height / 8, Program.FormatString(labelRow.Text1), Program.FormatString(labelRow.Text2), Program.FormatString(labelRow.Text3), Program.FormatString(labelRow.Text4), Program.FormatString(labelRow.Text5), Program.FormatString(labelRow.Text6), Program.FormatString(labelRow.Text7), Program.FormatString(labelRow.Text8), Program.FormatString(labelRow.Text9), Program.FormatString(labelRow.Text10), Program.FormatString(labelRow.Text11), Program.FormatString(labelRow.Text12), Program.FormatString(labelRow.Text13), Program.FormatString(labelRow.Text14), Program.FormatString(labelRow.Text15), Program.FormatString(labelRow.Text16), labelRow.Version, Program.FormatString(labelRow.Text17), Program.FormatString(labelRow.Text18), Program.FormatString(labelRow.Text19), Program.FormatString(labelRow.Text20), Program.FormatString(labelRow.Text21), Program.FormatString(labelRow.Text22), Program.FormatString(labelRow.Text23), Program.FormatString(labelRow.Text24), Program.FormatString(labelRow.Text25), Program.FormatString(labelRow.Text26), Program.FormatString(labelRow.Text27), Program.FormatString(labelRow.Text28), Program.FormatString(labelRow.Text29), Program.FormatString(labelRow.Text30), Program.FormatString(labelRow.Text31), Program.FormatString(labelRow.Text32));
					ECSDataSet.LabelItemRow[] labelItemRows = labelRow.GetLabelItemRows();
					foreach (ECSDataSet.LabelItemRow labelItemRow in labelItemRows)
					{
						streamWriter.WriteLine("LAS\t{0}\t{1}\t{2}\t{3}\t{4}\t{5}\t{6}\t{7}\t{8}\t{9}\t{10}\t{11}\t", labelItemRow.SubID, labelItemRow.Flag1, labelItemRow.Flag2, labelItemRow.Flag3, labelItemRow.Print, labelItemRow.Angle, labelItemRow.Align, labelItemRow.Font, labelItemRow.Left, labelItemRow.Top, labelItemRow.Width, labelItemRow.Height);
					}
					streamWriter.WriteLine("LAE\t");
				}
				streamWriter.WriteLine("END\tLAB\t");
			}
			if (salesmanCheckBox.Checked)
			{
				if (clearCheckBox.Checked)
				{
					streamWriter.WriteLine("CLR\tSAL\t");
					streamWriter.WriteLine("CLR\tEND\t");
				}
				salesmanTableAdapter.Fill(eCSDataSet.Salesman);
				streamWriter.WriteLine("DWL\tSAL\t");
				DataRow[] array7 = eCSDataSet.Salesman.Select(flag ? ("SalesmanID >=  " + Settings.Default.minUserSalesmanID) : string.Empty);
				for (int num = 0; num < array7.Length; num++)
				{
					ECSDataSet.SalesmanRow salesmanRow = (ECSDataSet.SalesmanRow)array7[num];
					streamWriter.WriteLine("SAL\t{0}\t{1}\t{2}\t{3}\t{4}\t{5}\t{6}\t", salesmanRow.SalesmanID, salesmanRow.Name, salesmanRow.Password, salesmanRow.Discount_Low, salesmanRow.Discount_High, salesmanRow.RightFB, salesmanRow.Code);
				}
				streamWriter.WriteLine("END\tSAL\t");
			}
			if (fontCheckBox.Checked)
			{
				streamWriter.WriteLine("DWL\tFNT\t");
				streamWriter.Write("FNT\t");
				string path = ((fontComboBox.SelectedIndex != 0) ? (Application.StartupPath + "\\binary\\Font\\" + (string)fontComboBox.SelectedItem + ".bin") : (Application.StartupPath + "\\binary\\Font.bin"));
				if (File.Exists(path))
				{
					byte[] array8 = File.ReadAllBytes(path);
					byte[] array9 = array8;
					foreach (byte b in array9)
					{
						char value = (char)(64 + b / 16);
						char value2 = (char)(64 + b % 16);
						streamWriter.Write(value);
						streamWriter.Write(value2);
					}
					streamWriter.WriteLine("\t");
				}
				streamWriter.WriteLine("END\tFNT\t");
			}
			if (bmpCheckBox.Checked)
			{
				if (clearCheckBox.Checked)
				{
					streamWriter.WriteLine("CLR\tBMP\t");
					streamWriter.WriteLine("CLR\tEND\t");
				}
				List<SinglePicture> lsp = new List<SinglePicture>();
				BitmapFuc.DataSet_Bitmap_Load(ref lsp, ref eCSDataSet);
				streamWriter.WriteLine("DWL\tBMP\t");
				for (int num2 = 0; num2 < eCSDataSet.Bitmap.Count; num2++)
				{
					ECSDataSet.BitmapRow bitmapRow = eCSDataSet.Bitmap[num2];
					string st = "";
					Program.getByte_multi((uint)bitmapRow.ID, ref st, 4);
					Program.getByte_multi((uint)((Image)bitmapRow.Picture).Size.Width, ref st, 2);
					Program.getByte_multi((uint)((Image)bitmapRow.Picture).Size.Height, ref st, 2);
					for (int num3 = 0; num3 < 22; num3++)
					{
						Program.getByte_multi(0u, ref st, 4);
					}
					st += bitmapRow.PicString;
					streamWriter.WriteLine("BMP\t{0}\t{1}\t", bitmapRow.ID, st);
				}
				streamWriter.WriteLine("END\tBMP\t");
			}
			if (vipCheckBox.Checked)
			{
				if (clearCheckBox.Checked)
				{
					streamWriter.WriteLine("CLR\tVIP\t");
					streamWriter.WriteLine("CLR\tEND\t");
				}
				vipTableAdapter.Fill(eCSDataSet.VIP);
				streamWriter.WriteLine("DWL\tVIP\t");
				foreach (ECSDataSet.VIPRow item4 in eCSDataSet.VIP)
				{
					long num4 = Convert.ToInt64(item4.BAR);
					long num5;
					try
					{
						num5 = Convert.ToInt64(item4.PH);
					}
					catch (Exception)
					{
						num5 = 0L;
					}
					decimal d = -1m;
					if (vipPointCheckBox.Checked)
					{
						d = item4.Point;
					}
					streamWriter.WriteLine("VIP\t{0}\t{1}\t{2}\t{3}\t{4}\t{5}\t", num4 / 1000000000, num4 % 1000000000, num5 / 1000000000, num5 % 1000000000, Program.FormatDecimal(d, Program.DecimalFormat.Price), item4.Discount);
				}
				streamWriter.WriteLine("END\tVIP\t");
			}
			if (custom1CheckBox.Checked)
			{
				custom1TableAdapter.Fill(eCSDataSet.Custom1);
				SaveCustom(streamWriter, custom1Row);
			}
			if (custom2CheckBox.Checked)
			{
				custom2TableAdapter.Fill(eCSDataSet.Custom2);
				SaveCustom(streamWriter, custom2Row);
			}
			if (custom3CheckBox.Checked)
			{
				custom3TableAdapter.Fill(eCSDataSet.Custom3);
				SaveCustom(streamWriter, custom3Row);
			}
			if (custom4CheckBox.Checked)
			{
				custom4TableAdapter.Fill(eCSDataSet.Custom4);
				SaveCustom(streamWriter, custom4Row);
			}
			if (wizardCheckBox.Checked)
			{
				streamWriter.Write(Program.sWizard);
			}
			streamWriter.Dispose();
			MessageBox.Show(this, Program.GetLang("pw_OperationSuccess"), Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Asterisk);
		}
		catch (Exception ex2)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex2.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
		}
		finally
		{
			serialPort.Close();
			Cursor.Current = Cursors.Default;
		}
	}

	private void exeButton_Click(object sender, EventArgs e)
	{
		if (saveButton.Checked)
		{
			if (serialRadioButton.Checked)
			{
				SaveToSerial();
			}
			else
			{
				SaveToFile();
			}
		}
		else if (openButton.Checked)
		{
			if (serialRadioButton.Checked)
			{
				OpenFromSerial();
			}
			else
			{
				OpenFromFile();
			}
		}
	}

	private void OpenFromFile()
	{
		string sourceFileName = filenameTextBox.Text;
		bool protect = false;
		string text = Application.StartupPath + "\\Tm-xA.tmp";
		Exception ex;
		try
		{
			File.Copy(sourceFileName, text, overwrite: true);
			ex = RDS.DataSet_ReadTMS(ref eCSDataSet, ref ecsOldSet, Settings.Default.configEncoding, text, "SaveForm", protect, specCheckBox.Checked, stringCheckBox.Checked, faceCheckBox.Checked ? ((string)faceListComboBox.SelectedValue) : "", deptCheckBox.Checked, classCheckBox.Checked, pLUCheckBox.Checked, barcodeCheckBox.Checked, labelCheckBox.Checked, salesmanCheckBox.Checked, vipCheckBox.Checked, custom1CheckBox.Checked, custom2CheckBox.Checked, custom3CheckBox.Checked, custom4CheckBox.Checked);
		}
		catch (Exception ex2)
		{
			ex = ex2;
		}
		finally
		{
			File.Delete(text);
		}
		if (ex != null)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			return;
		}
		MessageBox.Show(this, Program.GetLang("pw_OperationSuccess"), Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Asterisk);
		base.DialogResult = DialogResult.OK;
	}

	private void OpenFromSerial()
	{
		string empty = string.Empty;
		bool flag = false;
		eCSDataSet.Clear();
		ecsOldSet.Clear();
		if (specCheckBox.Checked)
		{
			specTableAdapter.Fill(ecsOldSet.Spec);
		}
		if (stringCheckBox.Checked)
		{
			stringTableAdapter.Fill(ecsOldSet.String);
		}
		if (faceCheckBox.Checked)
		{
			object selectedValue = faceListComboBox.SelectedValue;
			faceListTableAdapter.Fill(ecsOldSet.FaceList);
			faceTableAdapter.Fill(ecsOldSet.Face);
			faceListComboBox.SelectedValue = selectedValue;
		}
		if (deptCheckBox.Checked)
		{
			deptTableAdapter.Fill(ecsOldSet.Dept);
		}
		if (classCheckBox.Checked)
		{
			classTableAdapter.Fill(ecsOldSet.Class);
		}
		if (pLUCheckBox.Checked)
		{
			pLUTableAdapter.Fill(ecsOldSet.PLU);
		}
		if (barcodeCheckBox.Checked)
		{
			barcodeTableAdapter.Fill(ecsOldSet.Barcode);
		}
		if (labelCheckBox.Checked)
		{
			labelTableAdapter.Fill(ecsOldSet.Label);
			labelItemTableAdapter.Fill(ecsOldSet.LabelItem);
		}
		if (salesmanCheckBox.Checked)
		{
			salesmanTableAdapter.Fill(ecsOldSet.Salesman);
		}
		if (custom1CheckBox.Checked)
		{
			custom1TableAdapter.Fill(ecsOldSet.Custom1);
		}
		if (custom2CheckBox.Checked)
		{
			custom2TableAdapter.Fill(ecsOldSet.Custom2);
		}
		if (custom3CheckBox.Checked)
		{
			custom3TableAdapter.Fill(ecsOldSet.Custom3);
		}
		if (custom4CheckBox.Checked)
		{
			custom4TableAdapter.Fill(ecsOldSet.Custom4);
		}
		try
		{
			Cursor.Current = Cursors.WaitCursor;
			if (int.TryParse(baudComboBox.Text, out var result))
			{
				Settings.Default.serailBaudRate = result;
				Settings.Default.Save();
				serialPort.BaudRate = result;
			}
			else
			{
				result = Settings.Default.serailBaudRate;
			}
			serialPort.PortName = serialComboBox.Text;
			serialPort.Encoding = Program.GetEncoding();
			serialPort.NewLine = Environment.NewLine;
			serialPort.Open();
			serialPort.WriteLine("UPL\tTIM\t");
			DateTime dateTime = DateTime.Now.AddSeconds(3.0);
			while (true)
			{
				int bytesToRead = serialPort.BytesToRead;
				if (bytesToRead > 10)
				{
					break;
				}
				if (DateTime.Now >= dateTime)
				{
					throw new TimeoutException();
				}
			}
			string[] array;
			do
			{
				empty = serialPort.ReadLine();
				array = empty.Split('\t');
			}
			while (!(array[0] == "END"));
			serialPort.WriteLine("UPL\tEND\t");
			if (specCheckBox.Checked)
			{
				serialPort.WriteLine("UPL\tTMS\t");
				while (true)
				{
					empty = serialPort.ReadLine();
					array = empty.Split('\t');
					if (array[0] == "END")
					{
						break;
					}
					if (array[0] != "TMS")
					{
						continue;
					}
					ECSDataSet.SpecRow specRow = eCSDataSet.Spec.NewSpecRow();
					try
					{
						specRow.SpecID = Program.ParseInt(array[1]);
						ECSDataSet.SpecRow specRow2 = ecsOldSet.Spec.FindBySpecID(specRow.SpecID);
						if (specRow2 != null)
						{
							if (!specRow2.Valid)
							{
								continue;
							}
							specRow.Valid = true;
							goto IL_041c;
						}
						specRow.Valid = false;
						goto IL_041c;
						IL_041c:
						specRow.Value = Program.ParseInt(array[2]);
						goto IL_0430;
					}
					catch (IndexOutOfRangeException)
					{
						goto IL_0430;
					}
					IL_0430:
					eCSDataSet.Spec.AddSpecRow(specRow);
				}
				serialPort.WriteLine("UPL\tEND\t");
			}
			if (stringCheckBox.Checked)
			{
				serialPort.WriteLine("UPL\tTMT\t");
				while (true)
				{
					empty = serialPort.ReadLine();
					array = empty.Split('\t');
					if (array[0] == "END")
					{
						break;
					}
					if (array[0] != "TMT")
					{
						continue;
					}
					ECSDataSet.StringRow stringRow = eCSDataSet.String.NewStringRow();
					try
					{
						stringRow.StringID = Program.ParseInt(array[1]);
						ECSDataSet.StringRow stringRow2 = ecsOldSet.String.FindByStringID(stringRow.StringID);
						if (stringRow2 != null)
						{
							if (!stringRow2.Valid)
							{
								continue;
							}
							stringRow.Valid = true;
							goto IL_0519;
						}
						stringRow.Valid = false;
						goto IL_0519;
						IL_0519:
						stringRow.Value = Program.ParseString(array[2]);
						goto IL_052d;
					}
					catch (IndexOutOfRangeException)
					{
						goto IL_052d;
					}
					IL_052d:
					eCSDataSet.String.AddStringRow(stringRow);
				}
				serialPort.WriteLine("UPL\tEND\t");
			}
			if (faceCheckBox.Checked)
			{
				faceListTableAdapter.Fill(eCSDataSet.FaceList);
				serialPort.WriteLine("UPL\tSCP\t");
				while (true)
				{
					empty = serialPort.ReadLine();
					array = empty.Split('\t');
					if (array[0] == "END")
					{
						break;
					}
					if (!(array[0] != "SCP"))
					{
						ECSDataSet.FaceRow faceRow = eCSDataSet.Face.NewFaceRow();
						try
						{
							faceRow.ScaleID = (string)faceListComboBox.SelectedValue;
							faceRow.PageID = Program.ParseInt(array[1]);
							faceRow.KeyID = Program.ParseInt(array[2]);
							faceRow.PLUID = Program.ParseInt(array[3]);
						}
						catch (IndexOutOfRangeException)
						{
						}
						eCSDataSet.Face.AddFaceRow(faceRow);
					}
				}
				serialPort.WriteLine("UPL\tEND\t");
			}
			if (deptCheckBox.Checked)
			{
				serialPort.WriteLine("UPL\tDPT\t");
				while (true)
				{
					empty = serialPort.ReadLine();
					array = empty.Split('\t');
					if (array[0] == "END")
					{
						break;
					}
					if (!(array[0] != "DPT"))
					{
						ECSDataSet.DeptRow deptRow = eCSDataSet.Dept.NewDeptRow();
						try
						{
							deptRow.DeptID = Program.ParseInt(array[1]);
							deptRow.Name = Program.ParseString(array[2]);
						}
						catch (IndexOutOfRangeException)
						{
						}
						if (!flag || deptRow.DeptID >= Settings.Default.minUserDeptID)
						{
							eCSDataSet.Dept.AddDeptRow(deptRow);
						}
					}
				}
				serialPort.WriteLine("UPL\tEND\t");
			}
			if (classCheckBox.Checked)
			{
				serialPort.WriteLine("UPL\tCLS\t");
				while (true)
				{
					empty = serialPort.ReadLine();
					array = empty.Split('\t');
					if (array[0] == "END")
					{
						break;
					}
					if (!(array[0] != "CLS"))
					{
						ECSDataSet.ClassRow classRow = eCSDataSet.Class.NewClassRow();
						try
						{
							classRow.ClassID = Program.ParseInt(array[1]);
							classRow.Name = Program.ParseString(array[2]);
							classRow.DeptID = Program.ParseInt(array[3]);
							classRow.LabelID1 = Program.ParseInt(array[4]);
							classRow.BarT1 = Program.ParseInt(array[5]);
							classRow.BarF1 = Program.ParseInt(array[6]);
							classRow.LabelID2 = Program.ParseInt(array[7]);
							classRow.BarT2 = Program.ParseInt(array[8]);
							classRow.BarF2 = Program.ParseInt(array[9]);
						}
						catch (IndexOutOfRangeException)
						{
						}
						if (!flag || classRow.ClassID >= Settings.Default.minUserClassID)
						{
							eCSDataSet.Class.AddClassRow(classRow);
						}
					}
				}
				serialPort.WriteLine("UPL\tEND\t");
			}
			if (pLUCheckBox.Checked)
			{
				serialPort.WriteLine("UPL\tPLU\t");
				while (true)
				{
					empty = serialPort.ReadLine();
					array = empty.Split('\t');
					if (array[0] == "END")
					{
						break;
					}
					if (array[0] != "PLU")
					{
						continue;
					}
					ECSDataSet.PLURow pLURow = eCSDataSet.PLU.NewPLURow();
					try
					{
						pLURow.PLUID = Program.ParseInt(array[1]);
						if (eCSDataSet.PLU.FindByPLUID(pLURow.PLUID) != null)
						{
							continue;
						}
						pLURow.Remark = Program.ParseInt(array[2]);
						pLURow.Index = Program.ParseString(array[3]);
						pLURow.UnitID = Program.ParseInt(array[4]);
						pLURow.Price = Program.ParseDecimal(array[5]);
						pLURow.Cost = Program.ParseDecimal(array[6]);
						pLURow.Tare = Program.ParseDecimal(array[7]);
						pLURow.LabelID1 = Program.ParseInt(array[8]);
						pLURow.BarT1 = Program.ParseInt(array[9]);
						pLURow.BarF1 = Program.ParseInt(array[10]);
						pLURow.LabelID2 = Program.ParseInt(array[11]);
						pLURow.BarT2 = Program.ParseInt(array[12]);
						pLURow.BarF2 = Program.ParseInt(array[13]);
						pLURow.ClassID = Program.ParseInt(array[14]);
						pLURow.Name = Program.ParseString(array[15]);
						pLURow.Text1 = Program.ParseString(array[16]);
						pLURow.Text2 = Program.ParseString(array[17]);
						pLURow.Text3 = Program.ParseString(array[18]);
						pLURow.Text4 = Program.ParseString(array[19]);
						pLURow.Text5 = Program.ParseString(array[20]);
						pLURow.Text6 = Program.ParseString(array[21]);
						pLURow.Text7 = Program.ParseString(array[22]);
						pLURow.PS_SD = Program.ParseInt(array[23]);
						pLURow.PS_ST = Program.ParseInt(array[24]);
						pLURow.PS_PD = Program.ParseInt(array[25]);
						pLURow.PS_PT = Program.ParseInt(array[26]);
						pLURow.PS_UD = Program.ParseInt(array[27]);
						pLURow.PC_SD = Program.ParseInt(array[28]);
						pLURow.PC_ST = Program.ParseInt(array[29]);
						pLURow.PC_PD = Program.ParseInt(array[30]);
						pLURow.PC_PT = Program.ParseInt(array[31]);
						pLURow.PC_UD = Program.ParseInt(array[32]);
						pLURow.DF_D = Program.ParseInt(array[33]);
						pLURow.DF_U = Program.ParseInt(array[34]);
						pLURow.DF_DN = Program.ParseDecimal(array[35]);
						pLURow.DF_UN = Program.ParseDecimal(array[36]);
						pLURow.DA_Sort1 = Program.ParseInt(array[37]);
						pLURow.DA_Day1 = Program.ParseInt(array[38]);
						pLURow.DA_Dn1 = Program.ParseDecimal(array[39]);
						pLURow.DA_Up1 = Program.ParseDecimal(array[40]);
						pLURow.DA_Num1 = Program.ParseDecimal(array[41]);
						pLURow.DA_Sort2 = Program.ParseInt(array[42]);
						pLURow.DA_Day2 = Program.ParseInt(array[43]);
						pLURow.DA_Dn2 = Program.ParseDecimal(array[44]);
						pLURow.DA_Up2 = Program.ParseDecimal(array[45]);
						pLURow.DA_Num2 = Program.ParseDecimal(array[46]);
						pLURow.DA_Sort3 = Program.ParseInt(array[47]);
						pLURow.DA_Day3 = Program.ParseInt(array[48]);
						pLURow.DA_Dn3 = Program.ParseDecimal(array[49]);
						pLURow.DA_Up3 = Program.ParseDecimal(array[50]);
						pLURow.DA_Num3 = Program.ParseDecimal(array[51]);
						pLURow.DA_Sort4 = Program.ParseInt(array[52]);
						pLURow.DA_Day4 = Program.ParseInt(array[53]);
						pLURow.DA_Dn4 = Program.ParseDecimal(array[54]);
						pLURow.DA_Up4 = Program.ParseDecimal(array[55]);
						pLURow.DA_Num4 = Program.ParseDecimal(array[56]);
						pLURow.TaxType = Program.ParseInt(array[57]);
						pLURow.Tax = Program.ParseInt(array[58]);
						pLURow.SspValue1 = Program.ParseInt(array[59]);
						pLURow.SspValue2 = Program.ParseInt(array[60]);
						pLURow.SspValue3 = Program.ParseInt(array[61]);
						pLURow.SspValue4 = Program.ParseInt(array[62]);
						pLURow.SType = Program.ParseInt(array[63]);
						pLURow.ALPHA = Program.ParseString(array[64]);
						pLURow.Flag = Program.ParseInt(array[65]);
						pLURow.Flag_Value = Program.ParseInt(array[66]);
						pLURow.Bitmap = Program.ParseInt(array[67]);
						goto IL_0d28;
					}
					catch (IndexOutOfRangeException)
					{
						goto IL_0d28;
					}
					IL_0d28:
					if (!flag || pLURow.PLUID >= Settings.Default.minUserPLUID)
					{
						eCSDataSet.PLU.AddPLURow(pLURow);
					}
				}
				serialPort.WriteLine("UPL\tEND\t");
			}
			if (barcodeCheckBox.Checked)
			{
				serialPort.WriteLine("UPL\tBAR\t");
				while (true)
				{
					empty = serialPort.ReadLine();
					array = empty.Split('\t');
					if (array[0] == "END")
					{
						break;
					}
					if (!(array[0] != "BAR"))
					{
						ECSDataSet.BarcodeRow barcodeRow = eCSDataSet.Barcode.NewBarcodeRow();
						try
						{
							barcodeRow.BarID = Program.ParseInt(array[1]);
							barcodeRow.Name = Program.ParseString(array[2]);
							barcodeRow.Format = Program.ParseInt(array[3]);
							barcodeRow.Check = Program.ParseInt(array[4]);
							barcodeRow.Num1 = Program.ParseInt(array[5]);
							barcodeRow.Num2 = Program.ParseInt(array[6]);
							barcodeRow.TChar = array[7];
						}
						catch (IndexOutOfRangeException)
						{
						}
						if (!flag || barcodeRow.BarID >= Settings.Default.minUserBarcodeID)
						{
							eCSDataSet.Barcode.AddBarcodeRow(barcodeRow);
						}
					}
				}
				serialPort.WriteLine("UPL\tEND\t");
			}
			if (labelCheckBox.Checked)
			{
				serialPort.WriteLine("UPL\tLAB\t");
				while (true)
				{
					empty = serialPort.ReadLine();
					array = empty.Split('\t');
					if (array[0] == "END")
					{
						break;
					}
					if (array[0] != "LAB")
					{
						continue;
					}
					ECSDataSet.LabelRow labelRow = eCSDataSet.Label.NewLabelRow();
					try
					{
						labelRow.LabelID = Program.ParseInt(array[1]);
						labelRow.Name = Program.ParseString(array[2]);
						labelRow.Sort = Program.ParseInt(array[3]);
						labelRow.Width = Program.ParseInt(array[4]) * 8;
						labelRow.Height = Program.ParseInt(array[5]) * 8;
						labelRow.Text1 = Program.ParseString(array[6]);
						labelRow.Text2 = Program.ParseString(array[7]);
						labelRow.Text3 = Program.ParseString(array[8]);
						labelRow.Text4 = Program.ParseString(array[9]);
						labelRow.Text5 = Program.ParseString(array[10]);
						labelRow.Text6 = Program.ParseString(array[11]);
						labelRow.Text7 = Program.ParseString(array[12]);
						labelRow.Text8 = Program.ParseString(array[13]);
						labelRow.Text9 = Program.ParseString(array[14]);
						labelRow.Text10 = Program.ParseString(array[15]);
						labelRow.Text11 = Program.ParseString(array[16]);
						labelRow.Text12 = Program.ParseString(array[17]);
						labelRow.Text13 = Program.ParseString(array[18]);
						labelRow.Text14 = Program.ParseString(array[19]);
						labelRow.Text15 = Program.ParseString(array[20]);
						labelRow.Text16 = Program.ParseString(array[21]);
						labelRow.Version = Program.ParseInt(array[22]);
						labelRow.Text17 = Program.ParseString(array[23]);
						labelRow.Text18 = Program.ParseString(array[24]);
						labelRow.Text19 = Program.ParseString(array[25]);
						labelRow.Text20 = Program.ParseString(array[26]);
						labelRow.Text21 = Program.ParseString(array[27]);
						labelRow.Text22 = Program.ParseString(array[28]);
						labelRow.Text23 = Program.ParseString(array[29]);
						labelRow.Text24 = Program.ParseString(array[30]);
						labelRow.Text25 = Program.ParseString(array[31]);
						labelRow.Text26 = Program.ParseString(array[32]);
						labelRow.Text27 = Program.ParseString(array[33]);
						labelRow.Text28 = Program.ParseString(array[34]);
						labelRow.Text29 = Program.ParseString(array[35]);
						labelRow.Text30 = Program.ParseString(array[36]);
						labelRow.Text31 = Program.ParseString(array[37]);
						labelRow.Text32 = Program.ParseString(array[38]);
					}
					catch (IndexOutOfRangeException)
					{
					}
					if (flag && labelRow.LabelID < Settings.Default.minUserLabelID)
					{
						continue;
					}
					eCSDataSet.Label.AddLabelRow(labelRow);
					ecsOldSet.Label.FindByLabelID(labelRow.LabelID)?.Delete();
					while (true)
					{
						empty = serialPort.ReadLine();
						array = empty.Split('\t');
						if (array[0] == "LAE")
						{
							break;
						}
						if (!(array[0] != "LAS"))
						{
							ECSDataSet.LabelItemRow labelItemRow = eCSDataSet.LabelItem.NewLabelItemRow();
							try
							{
								labelItemRow.LabelID = labelRow.LabelID;
								labelItemRow.SubID = Program.ParseInt(array[1]);
								labelItemRow.Flag1 = Program.ParseInt(array[2]);
								labelItemRow.Flag2 = Program.ParseInt(array[3]);
								labelItemRow.Flag3 = Program.ParseInt(array[4]);
								labelItemRow.Print = Program.ParseInt(array[5]);
								labelItemRow.Angle = Program.ParseInt(array[6]);
								labelItemRow.Align = Program.ParseInt(array[7]);
								labelItemRow.Font = Program.ParseInt(array[8]);
								labelItemRow.Left = Program.ParseInt(array[9]);
								labelItemRow.Top = Program.ParseInt(array[10]);
								labelItemRow.Width = Program.ParseInt(array[11]);
								labelItemRow.Height = Program.ParseInt(array[12]);
							}
							catch (IndexOutOfRangeException)
							{
							}
							eCSDataSet.LabelItem.AddLabelItemRow(labelItemRow);
						}
					}
				}
				serialPort.WriteLine("UPL\tEND\t");
			}
			if (salesmanCheckBox.Checked)
			{
				serialPort.WriteLine("UPL\tSAL\t");
				while (true)
				{
					empty = serialPort.ReadLine();
					array = empty.Split('\t');
					if (array[0] == "END")
					{
						break;
					}
					if (!(array[0] != "SAL"))
					{
						ECSDataSet.SalesmanRow salesmanRow = eCSDataSet.Salesman.NewSalesmanRow();
						try
						{
							salesmanRow.SalesmanID = Program.ParseInt(array[1]);
							salesmanRow.Name = Program.ParseString(array[2]);
							salesmanRow.Password = Program.ParseString(array[3]);
							salesmanRow.Discount_Low = Program.ParseInt(array[4]);
							salesmanRow.Discount_High = Program.ParseInt(array[5]);
							salesmanRow.RightFB = Program.ParseInt(array[6]);
							salesmanRow.Code = Program.ParseString(array[7]);
						}
						catch (IndexOutOfRangeException)
						{
						}
						if (!flag || salesmanRow.SalesmanID >= Settings.Default.minUserSalesmanID)
						{
							eCSDataSet.Salesman.AddSalesmanRow(salesmanRow);
						}
					}
				}
				serialPort.WriteLine("UPL\tEND\t");
			}
			if (vipCheckBox.Checked)
			{
				serialPort.WriteLine("UPL\tVIP\t");
				while (true)
				{
					empty = serialPort.ReadLine();
					array = empty.Split('\t');
					if (array[0] == "END")
					{
						break;
					}
					if (!(array[0] != "VIP"))
					{
						ECSDataSet.VIPRow vIPRow = eCSDataSet.VIP.NewVIPRow();
						try
						{
							vIPRow.BAR = ((ulong)((long)Program.ParseInt(array[1]) * 1000000000L + Program.ParseInt(array[2]))).ToString();
							vIPRow.PH = ((ulong)((long)Program.ParseInt(array[3]) * 1000000000L + Program.ParseInt(array[4]))).ToString();
							vIPRow.Point = Program.ParseDecimal(array[5]);
							vIPRow.Discount = Program.ParseInt(array[6]);
						}
						catch (IndexOutOfRangeException)
						{
						}
						eCSDataSet.VIP.AddVIPRow(vIPRow);
					}
				}
				serialPort.WriteLine("UPL\tEND\t");
			}
			if (custom1CheckBox.Checked)
			{
				OpenCustom(custom1Row);
			}
			if (custom2CheckBox.Checked)
			{
				OpenCustom(custom2Row);
			}
			if (custom3CheckBox.Checked)
			{
				OpenCustom(custom3Row);
			}
			if (custom4CheckBox.Checked)
			{
				OpenCustom(custom4Row);
			}
			ecsOldSet.Merge(eCSDataSet);
			if (specCheckBox.Checked)
			{
				specTableAdapter.Update(ecsOldSet.Spec);
				DataSet_Update("Spec");
			}
			if (stringCheckBox.Checked)
			{
				stringTableAdapter.Update(ecsOldSet.String);
				DataSet_Update("String");
			}
			if (faceCheckBox.Checked)
			{
				faceTableAdapter.Update(ecsOldSet.Face);
				DataSet_Update("Face");
			}
			if (deptCheckBox.Checked)
			{
				deptTableAdapter.Update(ecsOldSet.Dept);
				DataSet_Update("Dept");
			}
			if (classCheckBox.Checked)
			{
				classTableAdapter.Update(ecsOldSet.Class);
				DataSet_Update("Class");
			}
			if (pLUCheckBox.Checked)
			{
				pLUTableAdapter.Update(ecsOldSet.PLU);
				DataSet_Update("PLU");
			}
			if (barcodeCheckBox.Checked)
			{
				barcodeTableAdapter.Update(ecsOldSet.Barcode);
				DataSet_Update("Barcode");
			}
			if (labelCheckBox.Checked)
			{
				labelTableAdapter.Update(ecsOldSet.Label);
				labelItemTableAdapter.Update(ecsOldSet.LabelItem);
				DataSet_Update("Label");
			}
			if (salesmanCheckBox.Checked)
			{
				salesmanTableAdapter.Update(ecsOldSet.Salesman);
				DataSet_Update("Salesman");
			}
			if (vipCheckBox.Checked)
			{
				vipTableAdapter.Update(ecsOldSet.VIP);
				DataSet_Update("VIP");
			}
			if (custom1CheckBox.Checked)
			{
				custom1TableAdapter.Update(ecsOldSet.Custom1);
				DataSet_Update("Custom1");
			}
			if (custom2CheckBox.Checked)
			{
				custom2TableAdapter.Update(ecsOldSet.Custom2);
				DataSet_Update("Custom2");
			}
			if (custom3CheckBox.Checked)
			{
				custom3TableAdapter.Update(ecsOldSet.Custom3);
				DataSet_Update("Custom3");
			}
			if (custom4CheckBox.Checked)
			{
				custom4TableAdapter.Update(ecsOldSet.Custom4);
				DataSet_Update("Custom4");
			}
			MessageBox.Show(this, Program.GetLang("pw_OperationSuccess"), Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Asterisk);
		}
		catch (Exception ex12)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex12.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
		}
		finally
		{
			serialPort.Close();
			Cursor.Current = Cursors.Default;
		}
	}

	private void saveButton_CheckedChanged(object sender, EventArgs e)
	{
		CheckBox checkBox = clearCheckBox;
		CheckBox checkBox2 = fontCheckBox;
		bool flag = (bmpCheckBox.Enabled = saveButton.Checked);
		bool enabled = (checkBox2.Enabled = flag);
		checkBox.Enabled = enabled;
		if (openButton.Checked)
		{
			CheckBox checkBox3 = fontCheckBox;
			bool flag4 = (bmpCheckBox.Checked = false);
			checkBox3.Checked = flag4;
		}
		if (Program.right == Program.Right.User)
		{
			fontCheckBox.Enabled = false;
			fontCheckBox.Checked = false;
		}
		exeButton.Enabled = saveButton.Checked || openButton.Checked;
		vipPointCheckBox.Enabled = vipCheckBox.Checked && saveButton.Checked;
		if (custom1CheckBox.Visible)
		{
			custom1CheckBox.Enabled = (saveButton.Checked ? custom1Row.Export : custom1Row.Import);
			if (!custom1CheckBox.Enabled)
			{
				custom1CheckBox.Checked = false;
			}
		}
		if (custom2CheckBox.Visible)
		{
			custom2CheckBox.Enabled = (saveButton.Checked ? custom2Row.Export : custom2Row.Import);
			if (!custom2CheckBox.Enabled)
			{
				custom2CheckBox.Checked = false;
			}
		}
		if (custom3CheckBox.Visible)
		{
			custom3CheckBox.Enabled = (saveButton.Checked ? custom3Row.Export : custom3Row.Import);
			if (!custom3CheckBox.Enabled)
			{
				custom3CheckBox.Checked = false;
			}
		}
		if (custom4CheckBox.Visible)
		{
			custom4CheckBox.Enabled = (saveButton.Checked ? custom4Row.Export : custom4Row.Import);
			if (!custom4CheckBox.Enabled)
			{
				custom4CheckBox.Checked = false;
			}
		}
	}

	public void HoldToDownload(bool Wizard, bool Spec, bool String, bool Barcode, bool Label, bool PLU, bool Face, bool Dept, bool Class, bool Unit, bool Salesman, bool SP1, bool SP2, bool SP3, bool SP4, bool VIP = false, bool Bitmap = false)
	{
		saveButton.Checked = true;
		faceCheckBox.Checked = Face;
		deptCheckBox.Checked = Dept;
		classCheckBox.Checked = Class;
		pLUCheckBox.Checked = PLU;
		unitCheckBox.Checked = false;
		salesmanCheckBox.Checked = Salesman;
		specCheckBox.Checked = Spec;
		stringCheckBox.Checked = String;
		labelCheckBox.Checked = Label;
		barcodeCheckBox.Checked = Barcode;
		custom1CheckBox.Checked = SP1;
		custom2CheckBox.Checked = SP2;
		custom3CheckBox.Checked = SP3;
		custom4CheckBox.Checked = SP4;
		vipCheckBox.Checked = VIP;
		bmpCheckBox.Checked = Bitmap;
		if (Wizard)
		{
			wizardCheckBox.Visible = true;
			wizardCheckBox.Checked = true;
			ItemDefaultEnable();
			if (Spec)
			{
				specCheckBox.Enabled = false;
			}
			if (String)
			{
				stringCheckBox.Enabled = false;
			}
			if (Face)
			{
				faceCheckBox.Enabled = false;
			}
			if (Dept)
			{
				deptCheckBox.Enabled = false;
			}
			if (Class)
			{
				classCheckBox.Enabled = false;
			}
			if (PLU)
			{
				pLUCheckBox.Enabled = false;
			}
			if (Label)
			{
				labelCheckBox.Enabled = false;
			}
			if (Barcode)
			{
				barcodeCheckBox.Enabled = false;
			}
			if (Salesman)
			{
				salesmanCheckBox.Enabled = false;
			}
			if (VIP)
			{
				vipCheckBox.Enabled = false;
			}
			if (Bitmap)
			{
				bmpCheckBox.Enabled = false;
			}
		}
		else
		{
			wizardCheckBox.Checked = false;
			wizardCheckBox.Visible = false;
		}
	}

	private void quicksetCheckBox_CheckedChanged(object sender, EventArgs e)
	{
		if (!wizardCheckBox.Checked)
		{
			ItemDefaultEnable();
			wizardCheckBox.Visible = false;
		}
	}

	private void vipCheckBox_CheckedChanged(object sender, EventArgs e)
	{
		vipPointCheckBox.Enabled = vipCheckBox.Checked && saveButton.Checked;
	}

	private void fontCheckBox_CheckedChanged(object sender, EventArgs e)
	{
		fontComboBox.Enabled = fontCheckBox.Checked;
	}

	private void faceCheckBox_CheckedChanged(object sender, EventArgs e)
	{
		faceListComboBox.Enabled = faceCheckBox.Checked;
	}
}

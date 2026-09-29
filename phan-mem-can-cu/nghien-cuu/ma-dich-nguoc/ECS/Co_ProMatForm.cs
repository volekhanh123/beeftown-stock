using System;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Windows.Forms;
using ECS.ECSDataSetTableAdapters;
using ECS.Properties;

namespace ECS;

public class Co_ProMatForm : Form
{
	private delegate void DataSet_RefreshCallback(string Type);

	private IContainer components;

	private ReportDataSet reportDataSet;

	private ECSDataSet ecsDataSet;

	private PLUTableAdapter pluTableAdapter;

	private BindingSource coPLU_ProMatBindingSource;

	private SplitContainer splitContainer2;

	private DataGridView dataGridView1;

	private BindingNavigator bindingNavigator1;

	private ToolStripLabel toolStripLabel1;

	private ToolStripButton toolStripButton1;

	private ToolStripButton toolStripButton2;

	private ToolStripButton toolStripButton3;

	private ToolStripSeparator toolStripSeparator1;

	private ToolStripTextBox toolStripTextBox1;

	private ToolStripSeparator toolStripSeparator2;

	private ToolStripButton toolStripButton4;

	private ToolStripButton toolStripButton5;

	private ToolStripSeparator toolStripSeparator3;

	private ToolStripButton toolStripButton6;

	private Label Error2_Label;

	private Button exeButton2;

	private Button cancelButton2;

	private NumericUpDown AddMulti2_NumericUpDown;

	private Label label2;

	private Label label3;

	private ComboBox AddPLU4_ComboBox;

	private ComboBox AddPLU3_ComboBox;

	private BindingSource PLU5_BindingSource;

	private BindingSource PLU6_BindingSource;

	private BindingSource PLU8_BindingSource;

	private BindingSource PLU7_BindingSource;

	private CoPLU_ProMatTableAdapter coPLU_ProMatTableAdapter;

	private DataGridViewComboBoxColumn pLUIDProductDataGridViewComboBoxColumn;

	private DataGridViewTextBoxColumn dataGridViewTextBoxColumn1;

	private DataGridViewComboBoxColumn pLUIDMaterialDataGridViewComboBoxColumn;

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
		System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(ECS.Co_ProMatForm));
		this.reportDataSet = new ECS.ReportDataSet();
		this.ecsDataSet = new ECS.ECSDataSet();
		this.pluTableAdapter = new ECS.ECSDataSetTableAdapters.PLUTableAdapter();
		this.coPLU_ProMatBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.splitContainer2 = new System.Windows.Forms.SplitContainer();
		this.dataGridView1 = new System.Windows.Forms.DataGridView();
		this.pLUIDProductDataGridViewComboBoxColumn = new System.Windows.Forms.DataGridViewComboBoxColumn();
		this.PLU5_BindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.dataGridViewTextBoxColumn1 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.pLUIDMaterialDataGridViewComboBoxColumn = new System.Windows.Forms.DataGridViewComboBoxColumn();
		this.PLU6_BindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.bindingNavigator1 = new System.Windows.Forms.BindingNavigator(this.components);
		this.toolStripLabel1 = new System.Windows.Forms.ToolStripLabel();
		this.toolStripButton1 = new System.Windows.Forms.ToolStripButton();
		this.toolStripButton2 = new System.Windows.Forms.ToolStripButton();
		this.toolStripButton3 = new System.Windows.Forms.ToolStripButton();
		this.toolStripSeparator1 = new System.Windows.Forms.ToolStripSeparator();
		this.toolStripTextBox1 = new System.Windows.Forms.ToolStripTextBox();
		this.toolStripSeparator2 = new System.Windows.Forms.ToolStripSeparator();
		this.toolStripButton4 = new System.Windows.Forms.ToolStripButton();
		this.toolStripButton5 = new System.Windows.Forms.ToolStripButton();
		this.toolStripSeparator3 = new System.Windows.Forms.ToolStripSeparator();
		this.toolStripButton6 = new System.Windows.Forms.ToolStripButton();
		this.Error2_Label = new System.Windows.Forms.Label();
		this.exeButton2 = new System.Windows.Forms.Button();
		this.cancelButton2 = new System.Windows.Forms.Button();
		this.AddMulti2_NumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.label2 = new System.Windows.Forms.Label();
		this.label3 = new System.Windows.Forms.Label();
		this.AddPLU4_ComboBox = new System.Windows.Forms.ComboBox();
		this.PLU8_BindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.AddPLU3_ComboBox = new System.Windows.Forms.ComboBox();
		this.PLU7_BindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.coPLU_ProMatTableAdapter = new ECS.ECSDataSetTableAdapters.CoPLU_ProMatTableAdapter();
		((System.ComponentModel.ISupportInitialize)this.reportDataSet).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.ecsDataSet).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.coPLU_ProMatBindingSource).BeginInit();
		this.splitContainer2.Panel1.SuspendLayout();
		this.splitContainer2.Panel2.SuspendLayout();
		this.splitContainer2.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.dataGridView1).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.PLU5_BindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.PLU6_BindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.bindingNavigator1).BeginInit();
		this.bindingNavigator1.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.AddMulti2_NumericUpDown).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.PLU8_BindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.PLU7_BindingSource).BeginInit();
		base.SuspendLayout();
		this.reportDataSet.DataSetName = "ReportDataSet";
		this.reportDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		this.ecsDataSet.DataSetName = "ECSDataSet";
		this.ecsDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		this.pluTableAdapter.ClearBeforeFill = true;
		this.coPLU_ProMatBindingSource.AllowNew = true;
		this.coPLU_ProMatBindingSource.DataMember = "CoPLU_ProMat";
		this.coPLU_ProMatBindingSource.DataSource = this.ecsDataSet;
		this.splitContainer2.Dock = System.Windows.Forms.DockStyle.Fill;
		this.splitContainer2.Location = new System.Drawing.Point(0, 0);
		this.splitContainer2.Name = "splitContainer2";
		this.splitContainer2.Orientation = System.Windows.Forms.Orientation.Horizontal;
		this.splitContainer2.Panel1.Controls.Add(this.dataGridView1);
		this.splitContainer2.Panel1.Controls.Add(this.bindingNavigator1);
		this.splitContainer2.Panel2.Controls.Add(this.Error2_Label);
		this.splitContainer2.Panel2.Controls.Add(this.exeButton2);
		this.splitContainer2.Panel2.Controls.Add(this.cancelButton2);
		this.splitContainer2.Panel2.Controls.Add(this.AddMulti2_NumericUpDown);
		this.splitContainer2.Panel2.Controls.Add(this.label2);
		this.splitContainer2.Panel2.Controls.Add(this.label3);
		this.splitContainer2.Panel2.Controls.Add(this.AddPLU4_ComboBox);
		this.splitContainer2.Panel2.Controls.Add(this.AddPLU3_ComboBox);
		this.splitContainer2.Size = new System.Drawing.Size(707, 500);
		this.splitContainer2.SplitterDistance = 409;
		this.splitContainer2.TabIndex = 2;
		this.dataGridView1.AllowUserToAddRows = false;
		this.dataGridView1.AllowUserToResizeColumns = false;
		this.dataGridView1.AutoGenerateColumns = false;
		this.dataGridView1.BackgroundColor = System.Drawing.SystemColors.Window;
		this.dataGridView1.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		this.dataGridView1.ColumnHeadersHeightSizeMode = System.Windows.Forms.DataGridViewColumnHeadersHeightSizeMode.AutoSize;
		this.dataGridView1.Columns.AddRange(this.pLUIDProductDataGridViewComboBoxColumn, this.dataGridViewTextBoxColumn1, this.pLUIDMaterialDataGridViewComboBoxColumn);
		this.dataGridView1.DataSource = this.coPLU_ProMatBindingSource;
		this.dataGridView1.Dock = System.Windows.Forms.DockStyle.Fill;
		this.dataGridView1.Location = new System.Drawing.Point(0, 25);
		this.dataGridView1.Name = "dataGridView1";
		this.dataGridView1.RowHeadersWidth = 20;
		this.dataGridView1.RowTemplate.Height = 23;
		this.dataGridView1.SelectionMode = System.Windows.Forms.DataGridViewSelectionMode.FullRowSelect;
		this.dataGridView1.Size = new System.Drawing.Size(707, 384);
		this.dataGridView1.TabIndex = 0;
		this.dataGridView1.DataError += new System.Windows.Forms.DataGridViewDataErrorEventHandler(dataGridView1_DataError);
		this.pLUIDProductDataGridViewComboBoxColumn.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.pLUIDProductDataGridViewComboBoxColumn.DataPropertyName = "PLUID_Product";
		this.pLUIDProductDataGridViewComboBoxColumn.DataSource = this.PLU5_BindingSource;
		this.pLUIDProductDataGridViewComboBoxColumn.DisplayMember = "Name";
		this.pLUIDProductDataGridViewComboBoxColumn.HeaderText = "Product";
		this.pLUIDProductDataGridViewComboBoxColumn.Name = "pLUIDProductDataGridViewComboBoxColumn";
		this.pLUIDProductDataGridViewComboBoxColumn.ReadOnly = true;
		this.pLUIDProductDataGridViewComboBoxColumn.ValueMember = "PLUID";
		this.PLU5_BindingSource.AllowNew = false;
		this.PLU5_BindingSource.DataMember = "PLU";
		this.PLU5_BindingSource.DataSource = this.ecsDataSet;
		this.dataGridViewTextBoxColumn1.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.dataGridViewTextBoxColumn1.DataPropertyName = "Multi";
		this.dataGridViewTextBoxColumn1.FillWeight = 30f;
		this.dataGridViewTextBoxColumn1.HeaderText = "<---   ×";
		this.dataGridViewTextBoxColumn1.Name = "dataGridViewTextBoxColumn1";
		this.pLUIDMaterialDataGridViewComboBoxColumn.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.pLUIDMaterialDataGridViewComboBoxColumn.DataPropertyName = "PLUID_Material";
		this.pLUIDMaterialDataGridViewComboBoxColumn.DataSource = this.PLU6_BindingSource;
		this.pLUIDMaterialDataGridViewComboBoxColumn.DisplayMember = "Name";
		this.pLUIDMaterialDataGridViewComboBoxColumn.HeaderText = "Material";
		this.pLUIDMaterialDataGridViewComboBoxColumn.Name = "pLUIDMaterialDataGridViewComboBoxColumn";
		this.pLUIDMaterialDataGridViewComboBoxColumn.ReadOnly = true;
		this.pLUIDMaterialDataGridViewComboBoxColumn.ValueMember = "PLUID";
		this.PLU6_BindingSource.AllowNew = false;
		this.PLU6_BindingSource.DataMember = "PLU";
		this.PLU6_BindingSource.DataSource = this.ecsDataSet;
		this.bindingNavigator1.AddNewItem = null;
		this.bindingNavigator1.BindingSource = this.coPLU_ProMatBindingSource;
		this.bindingNavigator1.CountItem = this.toolStripLabel1;
		this.bindingNavigator1.DeleteItem = this.toolStripButton1;
		this.bindingNavigator1.Items.AddRange(new System.Windows.Forms.ToolStripItem[11]
		{
			this.toolStripButton2, this.toolStripButton3, this.toolStripSeparator1, this.toolStripTextBox1, this.toolStripLabel1, this.toolStripSeparator2, this.toolStripButton4, this.toolStripButton5, this.toolStripSeparator3, this.toolStripButton6,
			this.toolStripButton1
		});
		this.bindingNavigator1.Location = new System.Drawing.Point(0, 0);
		this.bindingNavigator1.MoveFirstItem = this.toolStripButton2;
		this.bindingNavigator1.MoveLastItem = this.toolStripButton5;
		this.bindingNavigator1.MoveNextItem = this.toolStripButton4;
		this.bindingNavigator1.MovePreviousItem = this.toolStripButton3;
		this.bindingNavigator1.Name = "bindingNavigator1";
		this.bindingNavigator1.PositionItem = this.toolStripTextBox1;
		this.bindingNavigator1.Size = new System.Drawing.Size(707, 25);
		this.bindingNavigator1.TabIndex = 1;
		this.bindingNavigator1.Text = "bindingNavigator1";
		this.toolStripLabel1.Name = "toolStripLabel1";
		this.toolStripLabel1.Size = new System.Drawing.Size(35, 22);
		this.toolStripLabel1.Text = "/ {0}";
		this.toolStripButton1.Image = (System.Drawing.Image)resources.GetObject("toolStripButton1.Image");
		this.toolStripButton1.Name = "toolStripButton1";
		this.toolStripButton1.RightToLeftAutoMirrorImage = true;
		this.toolStripButton1.Size = new System.Drawing.Size(49, 22);
		this.toolStripButton1.Text = "删除";
		this.toolStripButton2.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.toolStripButton2.Image = (System.Drawing.Image)resources.GetObject("toolStripButton2.Image");
		this.toolStripButton2.Name = "toolStripButton2";
		this.toolStripButton2.RightToLeftAutoMirrorImage = true;
		this.toolStripButton2.Size = new System.Drawing.Size(23, 22);
		this.toolStripButton2.Text = "移到第一条记录";
		this.toolStripButton3.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.toolStripButton3.Image = (System.Drawing.Image)resources.GetObject("toolStripButton3.Image");
		this.toolStripButton3.Name = "toolStripButton3";
		this.toolStripButton3.RightToLeftAutoMirrorImage = true;
		this.toolStripButton3.Size = new System.Drawing.Size(23, 22);
		this.toolStripButton3.Text = "移到上一条记录";
		this.toolStripSeparator1.Name = "toolStripSeparator1";
		this.toolStripSeparator1.Size = new System.Drawing.Size(6, 25);
		this.toolStripTextBox1.AccessibleName = "位置";
		this.toolStripTextBox1.AutoSize = false;
		this.toolStripTextBox1.Name = "toolStripTextBox1";
		this.toolStripTextBox1.Size = new System.Drawing.Size(50, 21);
		this.toolStripTextBox1.Text = "0";
		this.toolStripSeparator2.Name = "toolStripSeparator2";
		this.toolStripSeparator2.Size = new System.Drawing.Size(6, 25);
		this.toolStripButton4.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.toolStripButton4.Image = (System.Drawing.Image)resources.GetObject("toolStripButton4.Image");
		this.toolStripButton4.Name = "toolStripButton4";
		this.toolStripButton4.RightToLeftAutoMirrorImage = true;
		this.toolStripButton4.Size = new System.Drawing.Size(23, 22);
		this.toolStripButton4.Text = "移到下一条记录";
		this.toolStripButton5.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.toolStripButton5.Image = (System.Drawing.Image)resources.GetObject("toolStripButton5.Image");
		this.toolStripButton5.Name = "toolStripButton5";
		this.toolStripButton5.RightToLeftAutoMirrorImage = true;
		this.toolStripButton5.Size = new System.Drawing.Size(23, 22);
		this.toolStripButton5.Text = "移到最后一条记录";
		this.toolStripSeparator3.Name = "toolStripSeparator3";
		this.toolStripSeparator3.Size = new System.Drawing.Size(6, 25);
		this.toolStripButton6.Image = (System.Drawing.Image)resources.GetObject("toolStripButton6.Image");
		this.toolStripButton6.Name = "toolStripButton6";
		this.toolStripButton6.RightToLeftAutoMirrorImage = true;
		this.toolStripButton6.Size = new System.Drawing.Size(49, 22);
		this.toolStripButton6.Text = "新添";
		this.toolStripButton6.Click += new System.EventHandler(toolStripButton6_Click);
		this.Error2_Label.AutoSize = true;
		this.Error2_Label.ForeColor = System.Drawing.Color.Red;
		this.Error2_Label.Location = new System.Drawing.Point(22, 48);
		this.Error2_Label.Name = "Error2_Label";
		this.Error2_Label.Size = new System.Drawing.Size(41, 12);
		this.Error2_Label.TabIndex = 22;
		this.Error2_Label.Text = "label2";
		this.exeButton2.Enabled = false;
		this.exeButton2.ImeMode = System.Windows.Forms.ImeMode.NoControl;
		this.exeButton2.Location = new System.Drawing.Point(425, 48);
		this.exeButton2.Name = "exeButton2";
		this.exeButton2.Size = new System.Drawing.Size(120, 23);
		this.exeButton2.TabIndex = 20;
		this.exeButton2.Text = "button1";
		this.exeButton2.UseVisualStyleBackColor = true;
		this.exeButton2.Click += new System.EventHandler(exeButton2_Click);
		this.cancelButton2.ImeMode = System.Windows.Forms.ImeMode.NoControl;
		this.cancelButton2.Location = new System.Drawing.Point(562, 48);
		this.cancelButton2.Name = "cancelButton2";
		this.cancelButton2.Size = new System.Drawing.Size(120, 23);
		this.cancelButton2.TabIndex = 21;
		this.cancelButton2.Text = "button2";
		this.cancelButton2.UseVisualStyleBackColor = true;
		this.cancelButton2.Click += new System.EventHandler(cancelButton2_Click);
		this.AddMulti2_NumericUpDown.DecimalPlaces = 3;
		this.AddMulti2_NumericUpDown.Location = new System.Drawing.Point(272, 16);
		this.AddMulti2_NumericUpDown.Maximum = new decimal(new int[4] { 9999999, 0, 0, 0 });
		this.AddMulti2_NumericUpDown.Minimum = new decimal(new int[4] { 1, 0, 0, 196608 });
		this.AddMulti2_NumericUpDown.Name = "AddMulti2_NumericUpDown";
		this.AddMulti2_NumericUpDown.Size = new System.Drawing.Size(94, 21);
		this.AddMulti2_NumericUpDown.TabIndex = 3;
		this.AddMulti2_NumericUpDown.Value = new decimal(new int[4] { 1, 0, 0, 0 });
		this.label2.AutoSize = true;
		this.label2.Location = new System.Drawing.Point(370, 20);
		this.label2.Name = "label2";
		this.label2.Size = new System.Drawing.Size(17, 12);
		this.label2.TabIndex = 2;
		this.label2.Text = "×";
		this.label3.AutoSize = true;
		this.label3.Location = new System.Drawing.Point(234, 20);
		this.label3.Name = "label3";
		this.label3.Size = new System.Drawing.Size(29, 12);
		this.label3.TabIndex = 2;
		this.label3.Text = "<---";
		this.AddPLU4_ComboBox.DataSource = this.PLU8_BindingSource;
		this.AddPLU4_ComboBox.DisplayMember = "Name";
		this.AddPLU4_ComboBox.FormattingEnabled = true;
		this.AddPLU4_ComboBox.Location = new System.Drawing.Point(392, 16);
		this.AddPLU4_ComboBox.Name = "AddPLU4_ComboBox";
		this.AddPLU4_ComboBox.Size = new System.Drawing.Size(205, 20);
		this.AddPLU4_ComboBox.TabIndex = 1;
		this.AddPLU4_ComboBox.ValueMember = "PLUID";
		this.AddPLU4_ComboBox.Format += new System.Windows.Forms.ListControlConvertEventHandler(AddPLU_ComboBox_Format);
		this.AddPLU4_ComboBox.SelectedValueChanged += new System.EventHandler(AddPLU3_ComboBox_SelectedValueChanged);
		this.PLU8_BindingSource.AllowNew = false;
		this.PLU8_BindingSource.DataMember = "PLU";
		this.PLU8_BindingSource.DataSource = this.ecsDataSet;
		this.PLU8_BindingSource.Filter = "UnitID<>2";
		this.PLU8_BindingSource.Sort = "";
		this.AddPLU3_ComboBox.DataSource = this.PLU7_BindingSource;
		this.AddPLU3_ComboBox.DisplayMember = "Name";
		this.AddPLU3_ComboBox.FormattingEnabled = true;
		this.AddPLU3_ComboBox.Location = new System.Drawing.Point(20, 16);
		this.AddPLU3_ComboBox.Name = "AddPLU3_ComboBox";
		this.AddPLU3_ComboBox.Size = new System.Drawing.Size(205, 20);
		this.AddPLU3_ComboBox.TabIndex = 1;
		this.AddPLU3_ComboBox.ValueMember = "PLUID";
		this.AddPLU3_ComboBox.Format += new System.Windows.Forms.ListControlConvertEventHandler(AddPLU_ComboBox_Format);
		this.AddPLU3_ComboBox.SelectedValueChanged += new System.EventHandler(AddPLU3_ComboBox_SelectedValueChanged);
		this.PLU7_BindingSource.AllowNew = false;
		this.PLU7_BindingSource.DataMember = "PLU";
		this.PLU7_BindingSource.DataSource = this.ecsDataSet;
		this.PLU7_BindingSource.Filter = "";
		this.PLU7_BindingSource.Sort = "";
		this.coPLU_ProMatTableAdapter.ClearBeforeFill = true;
		base.AutoScaleDimensions = new System.Drawing.SizeF(6f, 12f);
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		base.ClientSize = new System.Drawing.Size(707, 500);
		base.Controls.Add(this.splitContainer2);
		base.MaximizeBox = false;
		base.MinimizeBox = false;
		base.Name = "Co_ProMatForm";
		base.ShowIcon = false;
		base.ShowInTaskbar = false;
		base.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
		this.Text = "ProMatForm";
		base.FormClosing += new System.Windows.Forms.FormClosingEventHandler(ProMatForm_FormClosing);
		base.Load += new System.EventHandler(ProMatForm_Load);
		((System.ComponentModel.ISupportInitialize)this.reportDataSet).EndInit();
		((System.ComponentModel.ISupportInitialize)this.ecsDataSet).EndInit();
		((System.ComponentModel.ISupportInitialize)this.coPLU_ProMatBindingSource).EndInit();
		this.splitContainer2.Panel1.ResumeLayout(false);
		this.splitContainer2.Panel1.PerformLayout();
		this.splitContainer2.Panel2.ResumeLayout(false);
		this.splitContainer2.Panel2.PerformLayout();
		this.splitContainer2.ResumeLayout(false);
		((System.ComponentModel.ISupportInitialize)this.dataGridView1).EndInit();
		((System.ComponentModel.ISupportInitialize)this.PLU5_BindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.PLU6_BindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.bindingNavigator1).EndInit();
		this.bindingNavigator1.ResumeLayout(false);
		this.bindingNavigator1.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.AddMulti2_NumericUpDown).EndInit();
		((System.ComponentModel.ISupportInitialize)this.PLU8_BindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.PLU7_BindingSource).EndInit();
		base.ResumeLayout(false);
	}

	public Co_ProMatForm()
	{
		InitializeComponent();
	}

	public void DataSet_Refresh(string Type)
	{
		if (base.InvokeRequired)
		{
			Invoke(new DataSet_RefreshCallback(DataSet_Refresh), Type);
		}
		else if (Type == "PLU")
		{
			pluTableAdapter.ClearBeforeFill = true;
			pluTableAdapter.Fill(ecsDataSet.PLU);
			PLU5_BindingSource.ResetBindings(metadataChanged: false);
			PLU6_BindingSource.ResetBindings(metadataChanged: false);
			PLU7_BindingSource.ResetBindings(metadataChanged: false);
			PLU8_BindingSource.ResetBindings(metadataChanged: false);
		}
	}

	private void AddPLU_ComboBox_Format(object sender, ListControlConvertEventArgs e)
	{
	}

	private void ProMatForm_Load(object sender, EventArgs e)
	{
		Text = Program.GetLang("pw_MaterialInProduct");
		ToolStripButton toolStripButton = toolStripButton6;
		string text = (exeButton2.Text = Program.GetLang("pw_AddNew"));
		toolStripButton.Text = text;
		toolStripButton1.Text = Program.GetLang("pw_Delete");
		cancelButton2.Text = Program.GetLang("pw_Cancel");
		pLUIDProductDataGridViewComboBoxColumn.HeaderText = Program.GetLang("pw_ProductPLU");
		pLUIDMaterialDataGridViewComboBoxColumn.HeaderText = Program.GetLang("pw_MaterialPLU");
		toolStripButton2.Text = Program.GetLang("pw_FirstRecord");
		toolStripButton5.Text = Program.GetLang("pw_LastRecord");
		toolStripButton4.Text = Program.GetLang("pw_NextRecord");
		toolStripButton3.Text = Program.GetLang("pw_PreviousRecord");
		pluTableAdapter.Fill(ecsDataSet.PLU);
		RDS.DataSet_Init_Unit(ref ecsDataSet);
		foreach (ECSDataSet.PLURow item in ecsDataSet.PLU)
		{
			item.Name = item.PLUID + " - " + item.Name;
		}
		coPLU_ProMatTableAdapter.Fill(ecsDataSet.CoPLU_ProMat);
		splitContainer2.Panel2Collapsed = true;
	}

	private ECSDataSet.CoPLU_BoxPcsRow GetCurrent_BoxPcsRow()
	{
		if (coPLU_ProMatBindingSource.Position == -1)
		{
			return null;
		}
		DataRowView dataRowView = (DataRowView)coPLU_ProMatBindingSource.Current;
		return (ECSDataSet.CoPLU_BoxPcsRow)dataRowView.Row;
	}

	private void DataSet_Update(string Type)
	{
		Program.mf.DataSet_Update(Type, "Co_ProMatForm");
	}

	public void SaveData()
	{
		Validate();
		try
		{
			coPLU_ProMatBindingSource.EndEdit();
		}
		catch (Exception ex)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			coPLU_ProMatBindingSource.CancelEdit();
		}
		if (ecsDataSet.HasChanges())
		{
			try
			{
				coPLU_ProMatTableAdapter.Update(ecsDataSet.CoPLU_ProMat);
				DataSet_Update("CoPLU_ProMat");
			}
			catch (Exception ex2)
			{
				MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex2.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			}
		}
	}

	private void ProMatForm_FormClosing(object sender, FormClosingEventArgs e)
	{
		SaveData();
	}

	private void cancelButton2_Click(object sender, EventArgs e)
	{
		splitContainer2.Panel1.Enabled = true;
		splitContainer2.Panel2Collapsed = true;
	}

	private void exeButton2_Click(object sender, EventArgs e)
	{
		ECSDataSet.CoPLU_ProMatRow coPLU_ProMatRow = ecsDataSet.CoPLU_ProMat.NewCoPLU_ProMatRow();
		coPLU_ProMatRow.PLUID_Product = (int)AddPLU3_ComboBox.SelectedValue;
		coPLU_ProMatRow.PLUID_Material = (int)AddPLU4_ComboBox.SelectedValue;
		coPLU_ProMatRow.Multi = AddMulti2_NumericUpDown.Value;
		ecsDataSet.CoPLU_ProMat.AddCoPLU_ProMatRow(coPLU_ProMatRow);
		splitContainer2.Panel1.Enabled = true;
		splitContainer2.Panel2Collapsed = true;
	}

	private void toolStripButton6_Click(object sender, EventArgs e)
	{
		splitContainer2.Panel1.Enabled = false;
		splitContainer2.Panel2Collapsed = false;
		AddPLU3_ComboBox.SelectedIndex = -1;
		AddPLU4_ComboBox.SelectedIndex = -1;
		AddMulti2_NumericUpDown.Value = 1m;
	}

	private void AddPLU3_ComboBox_SelectedValueChanged(object sender, EventArgs e)
	{
		try
		{
			int num = (int)AddPLU3_ComboBox.SelectedValue;
			int num2 = (int)AddPLU4_ComboBox.SelectedValue;
			if (num == num2)
			{
				Error2_Label.Text = Program.GetLang("pw_ProductPLUMustDifferToMaterialPLU");
				exeButton2.Enabled = false;
				return;
			}
			if (ecsDataSet.CoPLU_ProMat.FindByPLUID_ProductPLUID_Material(num, num2) != null)
			{
				Error2_Label.Text = Program.GetLang("pw_ProductMaterialExist");
				exeButton2.Enabled = false;
				return;
			}
			if (ecsDataSet.Unit.FindByUnitID(ecsDataSet.PLU.FindByPLUID(num2).UnitID).Punit == 2)
			{
				Error2_Label.Text = Program.GetLang("pw_MaterialPLUMustBeByWeightPLU");
				exeButton2.Enabled = false;
				return;
			}
			string filterExpression = $"[PLUID_Product] = '{num2}' Or [PLUID_Material] = '{num}'";
			DataRow[] array = ecsDataSet.CoPLU_ProMat.Select(filterExpression);
			if (array.Length > 0)
			{
				Error2_Label.Text = Program.GetLang("pw_Collision");
				exeButton2.Enabled = false;
			}
			else
			{
				Error2_Label.Text = "";
				exeButton2.Enabled = true;
			}
		}
		catch
		{
			Error2_Label.Text = Program.GetLang("pw_SelectProductPLUAndMaterialPLU");
			exeButton2.Enabled = false;
		}
	}

	private void dataGridView1_DataError(object sender, DataGridViewDataErrorEventArgs e)
	{
		e.Cancel = true;
	}
}

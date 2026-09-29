using System;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Globalization;
using System.Windows.Forms;
using ECS.ECSDataSetTableAdapters;
using ECS.Properties;

namespace ECS;

public class FaceAutoFilterForm : Form
{
	private IContainer components;

	private ECSDataSet eCSDataSet;

	private BindingSource pLUBindingSource;

	private PLUTableAdapter pLUTableAdapter;

	private Button okButton;

	private DataGridView classDataGridView;

	private Button cancelButton;

	private UIDataSet uiDataSet;

	private TableLayoutPanel FAF_TableLayoutPanel;

	private RadioButton AllPLU_RadioButton;

	private RadioButton ItemCode_RadioButton;

	private RadioButton Dept_RadioButton;

	private RadioButton PLUNumber_RadioButton;

	private RadioButton Class_RadioButton;

	private Panel PLUNumber_Panel;

	private Label AD2_L1_Label;

	private NumericUpDown PLUNumber_High_NumericUpDown;

	private Label AD2_L0_Label;

	private Label PLUNumber_Label;

	private NumericUpDown PLUNumber_Low_NumericUpDown;

	private Panel ItemCode_Panel;

	private Label label1;

	private NumericUpDown ItemCode_High_NumericUpDown;

	private Label label2;

	private Label ItemCode_Label;

	private NumericUpDown ItemCode_Low_NumericUpDown;

	private ClassTableAdapter classTableAdapter;

	private DeptTableAdapter deptTableAdapter;

	private BindingSource classBindingSource;

	private DataGridViewTextBoxColumn classIDDataGridViewTextBoxColumn;

	private DataGridViewTextBoxColumn nameDataGridViewTextBoxColumn;

	private DataGridViewTextBoxColumn deptIDDataGridViewTextBoxColumn;

	private DataGridView deptDataGridView;

	private DataGridViewTextBoxColumn dataGridViewTextBoxColumn1;

	private DataGridViewTextBoxColumn dataGridViewTextBoxColumn2;

	private BindingSource deptBindingSource;

	private Panel Class_Panel;

	private Panel Dept_Panel;

	private SplitContainer FAF_SplitContainer;

	private CheckBox AllClear_CheckBox;

	private int Sort;

	private int P1;

	private int P2;

	private bool P3;

	public int GetSort => Sort;

	public int GetP1 => P1;

	public int GetP2 => P2;

	public bool GetP3 => P3;

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
		System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(ECS.FaceAutoFilterForm));
		this.pLUBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.eCSDataSet = new ECS.ECSDataSet();
		this.pLUTableAdapter = new ECS.ECSDataSetTableAdapters.PLUTableAdapter();
		this.okButton = new System.Windows.Forms.Button();
		this.classDataGridView = new System.Windows.Forms.DataGridView();
		this.classIDDataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.nameDataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.deptIDDataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.classBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.cancelButton = new System.Windows.Forms.Button();
		this.uiDataSet = new ECS.UIDataSet();
		this.FAF_TableLayoutPanel = new System.Windows.Forms.TableLayoutPanel();
		this.ItemCode_Panel = new System.Windows.Forms.Panel();
		this.label1 = new System.Windows.Forms.Label();
		this.ItemCode_High_NumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.label2 = new System.Windows.Forms.Label();
		this.ItemCode_Label = new System.Windows.Forms.Label();
		this.ItemCode_Low_NumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.PLUNumber_Panel = new System.Windows.Forms.Panel();
		this.AD2_L1_Label = new System.Windows.Forms.Label();
		this.PLUNumber_High_NumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.AD2_L0_Label = new System.Windows.Forms.Label();
		this.PLUNumber_Label = new System.Windows.Forms.Label();
		this.PLUNumber_Low_NumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.Class_Panel = new System.Windows.Forms.Panel();
		this.Dept_Panel = new System.Windows.Forms.Panel();
		this.deptDataGridView = new System.Windows.Forms.DataGridView();
		this.dataGridViewTextBoxColumn1 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.dataGridViewTextBoxColumn2 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.deptBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.AllPLU_RadioButton = new System.Windows.Forms.RadioButton();
		this.ItemCode_RadioButton = new System.Windows.Forms.RadioButton();
		this.Dept_RadioButton = new System.Windows.Forms.RadioButton();
		this.PLUNumber_RadioButton = new System.Windows.Forms.RadioButton();
		this.Class_RadioButton = new System.Windows.Forms.RadioButton();
		this.classTableAdapter = new ECS.ECSDataSetTableAdapters.ClassTableAdapter();
		this.deptTableAdapter = new ECS.ECSDataSetTableAdapters.DeptTableAdapter();
		this.FAF_SplitContainer = new System.Windows.Forms.SplitContainer();
		this.AllClear_CheckBox = new System.Windows.Forms.CheckBox();
		((System.ComponentModel.ISupportInitialize)this.pLUBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.eCSDataSet).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.classDataGridView).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.classBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.uiDataSet).BeginInit();
		this.FAF_TableLayoutPanel.SuspendLayout();
		this.ItemCode_Panel.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.ItemCode_High_NumericUpDown).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.ItemCode_Low_NumericUpDown).BeginInit();
		this.PLUNumber_Panel.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.PLUNumber_High_NumericUpDown).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.PLUNumber_Low_NumericUpDown).BeginInit();
		this.Class_Panel.SuspendLayout();
		this.Dept_Panel.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.deptDataGridView).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.deptBindingSource).BeginInit();
		this.FAF_SplitContainer.Panel1.SuspendLayout();
		this.FAF_SplitContainer.Panel2.SuspendLayout();
		this.FAF_SplitContainer.SuspendLayout();
		base.SuspendLayout();
		this.pLUBindingSource.DataMember = "PLU";
		this.pLUBindingSource.DataSource = this.eCSDataSet;
		this.pLUBindingSource.Sort = "PLUID";
		this.eCSDataSet.DataSetName = "ECSDataSet";
		this.eCSDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		this.pLUTableAdapter.ClearBeforeFill = true;
		this.okButton.DialogResult = System.Windows.Forms.DialogResult.OK;
		resources.ApplyResources(this.okButton, "okButton");
		this.okButton.Name = "okButton";
		this.okButton.UseVisualStyleBackColor = true;
		this.okButton.Click += new System.EventHandler(okButton_Click);
		this.classDataGridView.AllowUserToAddRows = false;
		this.classDataGridView.AllowUserToDeleteRows = false;
		this.classDataGridView.AutoGenerateColumns = false;
		this.classDataGridView.BackgroundColor = System.Drawing.SystemColors.Window;
		this.classDataGridView.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		this.classDataGridView.Columns.AddRange(this.classIDDataGridViewTextBoxColumn, this.nameDataGridViewTextBoxColumn, this.deptIDDataGridViewTextBoxColumn);
		this.classDataGridView.DataSource = this.classBindingSource;
		resources.ApplyResources(this.classDataGridView, "classDataGridView");
		this.classDataGridView.MultiSelect = false;
		this.classDataGridView.Name = "classDataGridView";
		this.classDataGridView.ReadOnly = true;
		this.classDataGridView.RowTemplate.Height = 23;
		this.classDataGridView.SelectionMode = System.Windows.Forms.DataGridViewSelectionMode.FullRowSelect;
		this.classIDDataGridViewTextBoxColumn.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.classIDDataGridViewTextBoxColumn.DataPropertyName = "ClassID";
		this.classIDDataGridViewTextBoxColumn.FillWeight = 80f;
		resources.ApplyResources(this.classIDDataGridViewTextBoxColumn, "classIDDataGridViewTextBoxColumn");
		this.classIDDataGridViewTextBoxColumn.Name = "classIDDataGridViewTextBoxColumn";
		this.classIDDataGridViewTextBoxColumn.ReadOnly = true;
		this.nameDataGridViewTextBoxColumn.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.nameDataGridViewTextBoxColumn.DataPropertyName = "Name";
		this.nameDataGridViewTextBoxColumn.FillWeight = 120f;
		resources.ApplyResources(this.nameDataGridViewTextBoxColumn, "nameDataGridViewTextBoxColumn");
		this.nameDataGridViewTextBoxColumn.Name = "nameDataGridViewTextBoxColumn";
		this.nameDataGridViewTextBoxColumn.ReadOnly = true;
		this.deptIDDataGridViewTextBoxColumn.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.deptIDDataGridViewTextBoxColumn.DataPropertyName = "DeptID";
		this.deptIDDataGridViewTextBoxColumn.FillWeight = 60f;
		resources.ApplyResources(this.deptIDDataGridViewTextBoxColumn, "deptIDDataGridViewTextBoxColumn");
		this.deptIDDataGridViewTextBoxColumn.Name = "deptIDDataGridViewTextBoxColumn";
		this.deptIDDataGridViewTextBoxColumn.ReadOnly = true;
		this.classBindingSource.DataMember = "Class";
		this.classBindingSource.DataSource = this.eCSDataSet;
		this.classBindingSource.Sort = "";
		this.cancelButton.DialogResult = System.Windows.Forms.DialogResult.Cancel;
		resources.ApplyResources(this.cancelButton, "cancelButton");
		this.cancelButton.Name = "cancelButton";
		this.cancelButton.UseVisualStyleBackColor = true;
		this.uiDataSet.DataSetName = "UIDataSet";
		this.uiDataSet.Locale = new System.Globalization.CultureInfo("zh-CN");
		this.uiDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		resources.ApplyResources(this.FAF_TableLayoutPanel, "FAF_TableLayoutPanel");
		this.FAF_TableLayoutPanel.Controls.Add(this.ItemCode_Panel, 0, 1);
		this.FAF_TableLayoutPanel.Controls.Add(this.PLUNumber_Panel, 0, 0);
		this.FAF_TableLayoutPanel.Controls.Add(this.Class_Panel, 0, 2);
		this.FAF_TableLayoutPanel.Controls.Add(this.Dept_Panel, 0, 3);
		this.FAF_TableLayoutPanel.Name = "FAF_TableLayoutPanel";
		this.ItemCode_Panel.Controls.Add(this.label1);
		this.ItemCode_Panel.Controls.Add(this.ItemCode_High_NumericUpDown);
		this.ItemCode_Panel.Controls.Add(this.label2);
		this.ItemCode_Panel.Controls.Add(this.ItemCode_Label);
		this.ItemCode_Panel.Controls.Add(this.ItemCode_Low_NumericUpDown);
		resources.ApplyResources(this.ItemCode_Panel, "ItemCode_Panel");
		this.ItemCode_Panel.Name = "ItemCode_Panel";
		resources.ApplyResources(this.label1, "label1");
		this.label1.Name = "label1";
		this.ItemCode_High_NumericUpDown.DataBindings.Add(new System.Windows.Forms.Binding("Value", this.pLUBindingSource, "DA_Up2", true));
		resources.ApplyResources(this.ItemCode_High_NumericUpDown, "ItemCode_High_NumericUpDown");
		this.ItemCode_High_NumericUpDown.Maximum = new decimal(new int[4] { 9999999, 0, 0, 0 });
		this.ItemCode_High_NumericUpDown.Name = "ItemCode_High_NumericUpDown";
		resources.ApplyResources(this.label2, "label2");
		this.label2.Name = "label2";
		resources.ApplyResources(this.ItemCode_Label, "ItemCode_Label");
		this.ItemCode_Label.Name = "ItemCode_Label";
		this.ItemCode_Low_NumericUpDown.DataBindings.Add(new System.Windows.Forms.Binding("Value", this.pLUBindingSource, "DA_Dn2", true));
		resources.ApplyResources(this.ItemCode_Low_NumericUpDown, "ItemCode_Low_NumericUpDown");
		this.ItemCode_Low_NumericUpDown.Maximum = new decimal(new int[4] { 9999999, 0, 0, 0 });
		this.ItemCode_Low_NumericUpDown.Name = "ItemCode_Low_NumericUpDown";
		this.PLUNumber_Panel.Controls.Add(this.AD2_L1_Label);
		this.PLUNumber_Panel.Controls.Add(this.PLUNumber_High_NumericUpDown);
		this.PLUNumber_Panel.Controls.Add(this.AD2_L0_Label);
		this.PLUNumber_Panel.Controls.Add(this.PLUNumber_Label);
		this.PLUNumber_Panel.Controls.Add(this.PLUNumber_Low_NumericUpDown);
		resources.ApplyResources(this.PLUNumber_Panel, "PLUNumber_Panel");
		this.PLUNumber_Panel.Name = "PLUNumber_Panel";
		resources.ApplyResources(this.AD2_L1_Label, "AD2_L1_Label");
		this.AD2_L1_Label.Name = "AD2_L1_Label";
		this.PLUNumber_High_NumericUpDown.DataBindings.Add(new System.Windows.Forms.Binding("Value", this.pLUBindingSource, "DA_Up2", true));
		resources.ApplyResources(this.PLUNumber_High_NumericUpDown, "PLUNumber_High_NumericUpDown");
		this.PLUNumber_High_NumericUpDown.Maximum = new decimal(new int[4] { 9999999, 0, 0, 0 });
		this.PLUNumber_High_NumericUpDown.Name = "PLUNumber_High_NumericUpDown";
		resources.ApplyResources(this.AD2_L0_Label, "AD2_L0_Label");
		this.AD2_L0_Label.Name = "AD2_L0_Label";
		resources.ApplyResources(this.PLUNumber_Label, "PLUNumber_Label");
		this.PLUNumber_Label.Name = "PLUNumber_Label";
		this.PLUNumber_Low_NumericUpDown.DataBindings.Add(new System.Windows.Forms.Binding("Value", this.pLUBindingSource, "DA_Dn2", true));
		resources.ApplyResources(this.PLUNumber_Low_NumericUpDown, "PLUNumber_Low_NumericUpDown");
		this.PLUNumber_Low_NumericUpDown.Maximum = new decimal(new int[4] { 9999999, 0, 0, 0 });
		this.PLUNumber_Low_NumericUpDown.Name = "PLUNumber_Low_NumericUpDown";
		this.Class_Panel.Controls.Add(this.classDataGridView);
		resources.ApplyResources(this.Class_Panel, "Class_Panel");
		this.Class_Panel.Name = "Class_Panel";
		this.Dept_Panel.Controls.Add(this.deptDataGridView);
		resources.ApplyResources(this.Dept_Panel, "Dept_Panel");
		this.Dept_Panel.Name = "Dept_Panel";
		this.deptDataGridView.AllowUserToAddRows = false;
		this.deptDataGridView.AllowUserToDeleteRows = false;
		this.deptDataGridView.AutoGenerateColumns = false;
		this.deptDataGridView.BackgroundColor = System.Drawing.SystemColors.Window;
		this.deptDataGridView.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		this.deptDataGridView.Columns.AddRange(this.dataGridViewTextBoxColumn1, this.dataGridViewTextBoxColumn2);
		this.deptDataGridView.DataSource = this.deptBindingSource;
		resources.ApplyResources(this.deptDataGridView, "deptDataGridView");
		this.deptDataGridView.MultiSelect = false;
		this.deptDataGridView.Name = "deptDataGridView";
		this.deptDataGridView.ReadOnly = true;
		this.deptDataGridView.RowTemplate.Height = 23;
		this.deptDataGridView.SelectionMode = System.Windows.Forms.DataGridViewSelectionMode.FullRowSelect;
		this.dataGridViewTextBoxColumn1.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.dataGridViewTextBoxColumn1.DataPropertyName = "DeptID";
		this.dataGridViewTextBoxColumn1.FillWeight = 80f;
		resources.ApplyResources(this.dataGridViewTextBoxColumn1, "dataGridViewTextBoxColumn1");
		this.dataGridViewTextBoxColumn1.Name = "dataGridViewTextBoxColumn1";
		this.dataGridViewTextBoxColumn1.ReadOnly = true;
		this.dataGridViewTextBoxColumn2.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.dataGridViewTextBoxColumn2.DataPropertyName = "Name";
		this.dataGridViewTextBoxColumn2.FillWeight = 180f;
		resources.ApplyResources(this.dataGridViewTextBoxColumn2, "dataGridViewTextBoxColumn2");
		this.dataGridViewTextBoxColumn2.Name = "dataGridViewTextBoxColumn2";
		this.dataGridViewTextBoxColumn2.ReadOnly = true;
		this.deptBindingSource.DataMember = "Dept";
		this.deptBindingSource.DataSource = this.eCSDataSet;
		this.deptBindingSource.Sort = "";
		resources.ApplyResources(this.AllPLU_RadioButton, "AllPLU_RadioButton");
		this.AllPLU_RadioButton.Checked = true;
		this.AllPLU_RadioButton.Name = "AllPLU_RadioButton";
		this.AllPLU_RadioButton.TabStop = true;
		this.AllPLU_RadioButton.UseVisualStyleBackColor = true;
		this.AllPLU_RadioButton.CheckedChanged += new System.EventHandler(AllPLU_RadioButton_CheckedChanged);
		resources.ApplyResources(this.ItemCode_RadioButton, "ItemCode_RadioButton");
		this.ItemCode_RadioButton.Name = "ItemCode_RadioButton";
		this.ItemCode_RadioButton.UseVisualStyleBackColor = true;
		this.ItemCode_RadioButton.CheckedChanged += new System.EventHandler(AllPLU_RadioButton_CheckedChanged);
		resources.ApplyResources(this.Dept_RadioButton, "Dept_RadioButton");
		this.Dept_RadioButton.Name = "Dept_RadioButton";
		this.Dept_RadioButton.UseVisualStyleBackColor = true;
		this.Dept_RadioButton.CheckedChanged += new System.EventHandler(AllPLU_RadioButton_CheckedChanged);
		resources.ApplyResources(this.PLUNumber_RadioButton, "PLUNumber_RadioButton");
		this.PLUNumber_RadioButton.Name = "PLUNumber_RadioButton";
		this.PLUNumber_RadioButton.UseVisualStyleBackColor = true;
		this.PLUNumber_RadioButton.CheckedChanged += new System.EventHandler(AllPLU_RadioButton_CheckedChanged);
		resources.ApplyResources(this.Class_RadioButton, "Class_RadioButton");
		this.Class_RadioButton.Name = "Class_RadioButton";
		this.Class_RadioButton.UseVisualStyleBackColor = true;
		this.Class_RadioButton.CheckedChanged += new System.EventHandler(AllPLU_RadioButton_CheckedChanged);
		this.classTableAdapter.ClearBeforeFill = true;
		this.deptTableAdapter.ClearBeforeFill = true;
		this.FAF_SplitContainer.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		resources.ApplyResources(this.FAF_SplitContainer, "FAF_SplitContainer");
		this.FAF_SplitContainer.Name = "FAF_SplitContainer";
		this.FAF_SplitContainer.Panel1.Controls.Add(this.AllClear_CheckBox);
		this.FAF_SplitContainer.Panel1.Controls.Add(this.AllPLU_RadioButton);
		this.FAF_SplitContainer.Panel1.Controls.Add(this.Dept_RadioButton);
		this.FAF_SplitContainer.Panel1.Controls.Add(this.PLUNumber_RadioButton);
		this.FAF_SplitContainer.Panel1.Controls.Add(this.ItemCode_RadioButton);
		this.FAF_SplitContainer.Panel1.Controls.Add(this.Class_RadioButton);
		this.FAF_SplitContainer.Panel2.Controls.Add(this.FAF_TableLayoutPanel);
		resources.ApplyResources(this.AllClear_CheckBox, "AllClear_CheckBox");
		this.AllClear_CheckBox.Name = "AllClear_CheckBox";
		this.AllClear_CheckBox.UseVisualStyleBackColor = true;
		base.AcceptButton = this.okButton;
		resources.ApplyResources(this, "$this");
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		base.CancelButton = this.cancelButton;
		base.Controls.Add(this.FAF_SplitContainer);
		base.Controls.Add(this.cancelButton);
		base.Controls.Add(this.okButton);
		base.MaximizeBox = false;
		base.MinimizeBox = false;
		base.Name = "FaceAutoFilterForm";
		base.ShowInTaskbar = false;
		base.Load += new System.EventHandler(FaceAutoFilterForm_Load);
		((System.ComponentModel.ISupportInitialize)this.pLUBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.eCSDataSet).EndInit();
		((System.ComponentModel.ISupportInitialize)this.classDataGridView).EndInit();
		((System.ComponentModel.ISupportInitialize)this.classBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.uiDataSet).EndInit();
		this.FAF_TableLayoutPanel.ResumeLayout(false);
		this.ItemCode_Panel.ResumeLayout(false);
		this.ItemCode_Panel.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.ItemCode_High_NumericUpDown).EndInit();
		((System.ComponentModel.ISupportInitialize)this.ItemCode_Low_NumericUpDown).EndInit();
		this.PLUNumber_Panel.ResumeLayout(false);
		this.PLUNumber_Panel.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.PLUNumber_High_NumericUpDown).EndInit();
		((System.ComponentModel.ISupportInitialize)this.PLUNumber_Low_NumericUpDown).EndInit();
		this.Class_Panel.ResumeLayout(false);
		this.Dept_Panel.ResumeLayout(false);
		((System.ComponentModel.ISupportInitialize)this.deptDataGridView).EndInit();
		((System.ComponentModel.ISupportInitialize)this.deptBindingSource).EndInit();
		this.FAF_SplitContainer.Panel1.ResumeLayout(false);
		this.FAF_SplitContainer.Panel1.PerformLayout();
		this.FAF_SplitContainer.Panel2.ResumeLayout(false);
		this.FAF_SplitContainer.ResumeLayout(false);
		base.ResumeLayout(false);
	}

	public FaceAutoFilterForm()
	{
		InitializeComponent();
	}

	private void FaceAutoFilterForm_Load(object sender, EventArgs e)
	{
		Text = Program.GetLang("pw_Shortcutkey");
		okButton.Text = Program.GetLang("pw_OK");
		cancelButton.Text = Program.GetLang("pw_Cancel");
		AllClear_CheckBox.Text = Program.GetLang("pw_ClearAllFirst");
		classIDDataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_Number");
		nameDataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_Name");
		deptIDDataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_AffiliatedDept");
		dataGridViewTextBoxColumn1.HeaderText = Program.GetLang("pw_Number");
		dataGridViewTextBoxColumn2.HeaderText = Program.GetLang("pw_Name");
		AllPLU_RadioButton.Text = Program.GetLang("pw_AllPLU");
		Label pLUNumber_Label = PLUNumber_Label;
		string text = (PLUNumber_RadioButton.Text = Program.GetLang("pw_PLUNumber"));
		pLUNumber_Label.Text = text;
		Label itemCode_Label = ItemCode_Label;
		string text2 = (ItemCode_RadioButton.Text = Program.GetLang("pw_ItemCode"));
		itemCode_Label.Text = text2;
		Class_RadioButton.Text = Program.GetLang("pw_Class");
		Dept_RadioButton.Text = Program.GetLang("pw_Dept");
		Font = Settings.Default.CustomFont;
		pLUTableAdapter.Fill(eCSDataSet.PLU);
		classTableAdapter.Fill(eCSDataSet.Class);
		deptTableAdapter.Fill(eCSDataSet.Dept);
		classBindingSource.Filter = "ClassID >= " + (Settings.Default.minClassID - 1);
		deptBindingSource.Filter = "DeptID >= " + (Settings.Default.minDeptID - 1);
		AllPLU_RadioButton_CheckedChanged(null, null);
		if (eCSDataSet.PLU.Count < 1)
		{
			return;
		}
		int num2;
		int num = (num2 = 0);
		int num4;
		int num3 = (num4 = 9999999);
		foreach (ECSDataSet.PLURow item in eCSDataSet.PLU)
		{
			if (num < item.PLUID)
			{
				num = item.PLUID;
			}
			if (num3 > item.PLUID)
			{
				num3 = item.PLUID;
			}
			if (num2 < item.Remark)
			{
				num2 = item.Remark;
			}
			if (num4 > item.Remark)
			{
				num4 = item.Remark;
			}
		}
		PLUNumber_Low_NumericUpDown.Value = num3;
		PLUNumber_High_NumericUpDown.Value = num;
		ItemCode_Low_NumericUpDown.Value = num4;
		ItemCode_High_NumericUpDown.Value = num2;
	}

	private ECSDataSet.ClassRow GetCurrentClassRow()
	{
		if (classBindingSource.Position == -1)
		{
			return null;
		}
		DataRowView dataRowView = (DataRowView)classBindingSource.Current;
		return (ECSDataSet.ClassRow)dataRowView.Row;
	}

	private ECSDataSet.DeptRow GetCurrentDeptRow()
	{
		if (deptBindingSource.Position == -1)
		{
			return null;
		}
		DataRowView dataRowView = (DataRowView)deptBindingSource.Current;
		return (ECSDataSet.DeptRow)dataRowView.Row;
	}

	private void okButton_Click(object sender, EventArgs e)
	{
		try
		{
			P1 = 0;
			P2 = 0;
			P3 = AllClear_CheckBox.Checked;
			if (PLUNumber_RadioButton.Checked)
			{
				Sort = 1;
				P1 = (int)PLUNumber_Low_NumericUpDown.Value;
				P2 = (int)PLUNumber_High_NumericUpDown.Value;
			}
			else if (ItemCode_RadioButton.Checked)
			{
				Sort = 2;
				P1 = (int)ItemCode_Low_NumericUpDown.Value;
				P2 = (int)ItemCode_High_NumericUpDown.Value;
			}
			else if (Class_RadioButton.Checked)
			{
				Sort = 3;
				ECSDataSet.ClassRow currentClassRow = GetCurrentClassRow();
				P1 = currentClassRow.ClassID;
			}
			else if (Dept_RadioButton.Checked)
			{
				Sort = 3;
				ECSDataSet.DeptRow currentDeptRow = GetCurrentDeptRow();
				P1 = currentDeptRow.DeptID;
			}
			else
			{
				Sort = 0;
			}
		}
		catch (Exception)
		{
			Sort = 0;
		}
	}

	private void AllPLU_RadioButton_CheckedChanged(object sender, EventArgs e)
	{
		Panel pLUNumber_Panel = PLUNumber_Panel;
		Panel itemCode_Panel = ItemCode_Panel;
		Panel class_Panel = Class_Panel;
		bool flag = (Dept_Panel.Visible = false);
		bool flag3 = (class_Panel.Visible = flag);
		bool visible = (itemCode_Panel.Visible = flag3);
		pLUNumber_Panel.Visible = visible;
		RowStyle rowStyle = FAF_TableLayoutPanel.RowStyles[0];
		RowStyle rowStyle2 = FAF_TableLayoutPanel.RowStyles[1];
		RowStyle rowStyle3 = FAF_TableLayoutPanel.RowStyles[2];
		SizeType sizeType = (FAF_TableLayoutPanel.RowStyles[3].SizeType = SizeType.AutoSize);
		SizeType sizeType3 = (rowStyle3.SizeType = sizeType);
		SizeType sizeType5 = (rowStyle2.SizeType = sizeType3);
		rowStyle.SizeType = sizeType5;
		if (PLUNumber_RadioButton.Checked)
		{
			AllClear_CheckBox.Checked = true;
			FAF_SplitContainer.Panel2Collapsed = false;
			PLUNumber_Panel.Visible = true;
			FAF_TableLayoutPanel.RowStyles[0].SizeType = SizeType.Percent;
		}
		else if (ItemCode_RadioButton.Checked)
		{
			AllClear_CheckBox.Checked = true;
			FAF_SplitContainer.Panel2Collapsed = false;
			ItemCode_Panel.Visible = true;
			FAF_TableLayoutPanel.RowStyles[1].SizeType = SizeType.Percent;
		}
		else if (Class_RadioButton.Checked)
		{
			AllClear_CheckBox.Checked = true;
			FAF_SplitContainer.Panel2Collapsed = false;
			Class_Panel.Visible = true;
			FAF_TableLayoutPanel.RowStyles[2].SizeType = SizeType.Percent;
		}
		else if (Dept_RadioButton.Checked)
		{
			AllClear_CheckBox.Checked = true;
			FAF_SplitContainer.Panel2Collapsed = false;
			Dept_Panel.Visible = true;
			FAF_TableLayoutPanel.RowStyles[3].SizeType = SizeType.Percent;
		}
		else
		{
			AllClear_CheckBox.Checked = false;
			FAF_SplitContainer.Panel2Collapsed = true;
		}
	}
}

using System;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Windows.Forms;
using ECS.ECSDataSetTableAdapters;
using ECS.Properties;

namespace ECS;

public class ClassForm : Form
{
	private delegate void DataSet_RefreshCallback(string Type);

	private bool NoCTRowChanged;

	private bool DataSet_Changed;

	private IContainer components;

	private ECSDataSet eCSDataSet;

	private BindingSource classBindingSource;

	private ClassTableAdapter classTableAdapter;

	private BindingNavigator classBindingNavigator;

	private ToolStripButton bindingNavigatorAddNewItem;

	private ToolStripLabel bindingNavigatorCountItem;

	private ToolStripButton bindingNavigatorDeleteItem;

	private ToolStripButton bindingNavigatorMoveFirstItem;

	private ToolStripButton bindingNavigatorMovePreviousItem;

	private ToolStripSeparator bindingNavigatorSeparator;

	private ToolStripTextBox bindingNavigatorPositionItem;

	private ToolStripSeparator bindingNavigatorSeparator1;

	private ToolStripButton bindingNavigatorMoveNextItem;

	private ToolStripButton bindingNavigatorMoveLastItem;

	private ToolStripSeparator bindingNavigatorSeparator2;

	private SplitContainer splitContainer;

	private DataGridView classDataGridView;

	private TextBox nameTextBox;

	private ComboBox deptIDComboBox;

	private BindingSource deptBindingSource;

	private DeptTableAdapter deptTableAdapter;

	private NumericUpDown classIDNumericUpDown;

	private ToolStripSeparator toolStripSeparator1;

	private ToolStripTextBox bindingNavigatorID;

	private ToolStripButton bindingNavigatorGoto;

	private ToolStripButton bindingNavigatorFilter;

	private ToolStripButton P0_TMSFile_toolStripButton;

	private ToolStripButton P0_Ethernet_toolStripButton;

	private Label nameLabel;

	private Label classIDLabel;

	private Label deptIDLabel;

	private TableLayoutPanel Print_TableLayoutPanel;

	private Panel Print_Bill1_Panel;

	private ComboBox labelID1ComboBox;

	private ComboBox barT1ComboBox;

	private NumericUpDown barF1NumericUpDown;

	private Label labelID1Label;

	private Label barF1Label1;

	private Label barT1Label1;

	private Panel Print_Bill2_Panel;

	private ComboBox labelID2ComboBox;

	private Label barF2Label1;

	private Label barT2Label1;

	private ComboBox barT2ComboBox;

	private NumericUpDown barF2NumericUpDown;

	private Label labelID2Label;

	private Panel basic_Panel;

	private BindingSource labelBindingSource2;

	private BindingSource labelBindingSource1;

	private LabelTableAdapter labelTableAdapter;

	private BarcodeTableAdapter barcodeTableAdapter;

	private BindingSource barcodeBindingSource2;

	private BindingSource barcodeBindingSource1;

	private DataGridViewTextBoxColumn dataGridViewTextBoxColumn1;

	private DataGridViewTextBoxColumn dataGridViewTextBoxColumn2;

	private DataGridViewComboBoxColumn dataGridViewTextBoxColumn3;

	public ClassForm()
	{
		InitializeComponent();
	}

	public void DataSet_Refresh(string Type)
	{
		if (base.InvokeRequired)
		{
			Invoke(new DataSet_RefreshCallback(DataSet_Refresh), Type);
			return;
		}
		if (Type == "Dept")
		{
			NoCTRowChanged = true;
			int selectedIndex = deptIDComboBox.SelectedIndex;
			deptIDComboBox.SelectedIndex = -1;
			eCSDataSet.Dept.Clear();
			deptTableAdapter.Fill(eCSDataSet.Dept);
			deptBindingSource.ResetBindings(metadataChanged: false);
			deptIDComboBox.SelectedIndex = selectedIndex;
			NoCTRowChanged = false;
		}
		if (Type == "Class")
		{
			NoCTRowChanged = true;
			eCSDataSet.Class.Clear();
			classTableAdapter.Fill(eCSDataSet.Class);
			classBindingSource.ResetBindings(metadataChanged: false);
			NoCTRowChanged = false;
		}
		if (Type == "Barcode")
		{
			eCSDataSet.Barcode.Clear();
			barcodeTableAdapter.Fill(eCSDataSet.Barcode);
			barcodeBindingSource1.ResetBindings(metadataChanged: false);
			barcodeBindingSource2.ResetBindings(metadataChanged: false);
		}
		if (Type == "Label")
		{
			eCSDataSet.Label.Clear();
			labelTableAdapter.Fill(eCSDataSet.Label);
			labelBindingSource1.ResetBindings(metadataChanged: false);
			labelBindingSource2.ResetBindings(metadataChanged: false);
		}
	}

	private void DataSet_Update(string Type)
	{
		Program.mf.DataSet_Update(Type, "ClassForm");
	}

	private void ClassForm_Load(object sender, EventArgs e)
	{
		Text = Program.GetLang("pw_Class");
		bindingNavigatorAddNewItem.Text = Program.GetLang("pw_AddNew");
		bindingNavigatorDeleteItem.Text = Program.GetLang("pw_Delete");
		bindingNavigatorFilter.Text = Program.GetLang("pw_Filter");
		bindingNavigatorGoto.Text = Program.GetLang("pw_Switchto");
		bindingNavigatorMoveFirstItem.Text = Program.GetLang("pw_FirstRecord");
		bindingNavigatorMoveLastItem.Text = Program.GetLang("pw_LastRecord");
		bindingNavigatorMoveNextItem.Text = Program.GetLang("pw_NextRecord");
		bindingNavigatorMovePreviousItem.Text = Program.GetLang("pw_PreviousRecord");
		classIDLabel.Text = Program.GetLang("pw_Number") + ":";
		dataGridViewTextBoxColumn1.HeaderText = Program.GetLang("pw_Number");
		dataGridViewTextBoxColumn2.HeaderText = Program.GetLang("pw_Name");
		dataGridViewTextBoxColumn3.HeaderText = Program.GetLang("pw_AffiliatedDept");
		deptIDLabel.Text = Program.GetLang("pw_AffiliatedDept") + ":";
		nameLabel.Text = Program.GetLang("pw_Name") + ":";
		P0_Ethernet_toolStripButton.Text = Program.GetLang("pw_Ethernet");
		P0_TMSFile_toolStripButton.Text = Program.GetLang("pw_TMSFile");
		if (Settings.Default.Enable_PLU_Bill2)
		{
			Print_Bill2_Panel.Visible = true;
			labelID1Label.Text = Program.GetLang("pw_Bill1") + "-" + Program.GetLang("pw_PrintFormat") + ":";
			labelID2Label.Text = Program.GetLang("pw_Bill2") + "-" + Program.GetLang("pw_PrintFormat") + ":";
			barT1Label1.Text = Program.GetLang("pw_Bill1") + "-" + Program.GetLang("pw_Barcode") + ":";
			barT2Label1.Text = Program.GetLang("pw_Bill2") + "-" + Program.GetLang("pw_Barcode") + ":";
			barF1Label1.Text = Program.GetLang("pw_Bill1") + "-" + Program.GetLang("pw_BarcodeFlag") + ":";
			barF2Label1.Text = Program.GetLang("pw_Bill2") + "-" + Program.GetLang("pw_BarcodeFlag") + ":";
		}
		else
		{
			Print_Bill2_Panel.Visible = false;
			labelID1Label.Text = Program.GetLang("pw_PrintFormat") + ":";
			labelID2Label.Text = "";
			barT1Label1.Text = Program.GetLang("pw_Barcode") + ":";
			barT2Label1.Text = "";
			barF1Label1.Text = Program.GetLang("pw_BarcodeFlag") + ":";
			barF2Label1.Text = "";
		}
		Font = Settings.Default.CustomFont;
		if (Program.right == Program.Right.User)
		{
			classBindingSource.Filter = "ClassID >= " + Settings.Default.minUserClassID;
			deptBindingSource.Filter = "DeptID >= " + Settings.Default.minDeptID;
		}
		Program.LabelRight_SetXLocaltion(new Label[9] { classIDLabel, nameLabel, deptIDLabel, labelID1Label, barT1Label1, barF1Label1, labelID2Label, barT2Label1, barF2Label1 }, new Control[9] { classIDNumericUpDown, nameTextBox, deptIDComboBox, labelID1ComboBox, barT1ComboBox, barF1NumericUpDown, labelID2ComboBox, barT2ComboBox, barF2NumericUpDown });
		DataSet_Refresh("Dept");
		DataSet_Refresh("Barcode");
		DataSet_Refresh("Label");
		classTableAdapter.Fill(eCSDataSet.Class);
		eCSDataSet.Class.ClassRowChanged += Class_ClassRowChanged;
	}

	private void Class_ClassRowChanged(object sender, ECSDataSet.ClassRowChangeEvent e)
	{
		if (NoCTRowChanged || e.Action == DataRowAction.Rollback || e.Action == DataRowAction.Commit)
		{
			return;
		}
		if (e.Row.ClassID > Settings.Default.maxClassID)
		{
			e.Row.RejectChanges();
			return;
		}
		if (e.Row.ClassID < Settings.Default.minUserClassID && Program.right == Program.Right.User)
		{
			e.Row.RejectChanges();
			return;
		}
		try
		{
			classTableAdapter.Update(eCSDataSet.Class);
			DataSet_Changed = true;
		}
		catch (Exception ex)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
		}
	}

	private void deptIDComboBox_Format(object sender, ListControlConvertEventArgs e)
	{
		DataRowView dataRowView = (DataRowView)e.ListItem;
		if (dataRowView != null)
		{
			e.Value = string.Format("{0} - {1}", dataRowView["DeptID"], dataRowView["Name"]);
		}
	}

	public void SaveData()
	{
		Validate();
		try
		{
			classBindingSource.EndEdit();
		}
		catch (Exception ex)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			classBindingSource.CancelEdit();
		}
		if (eCSDataSet.HasChanges())
		{
			try
			{
				classTableAdapter.Update(eCSDataSet.Class);
				DataSet_Changed = true;
			}
			catch (Exception ex2)
			{
				MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex2.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			}
		}
	}

	private void ClassForm_FormClosing(object sender, FormClosingEventArgs e)
	{
		eCSDataSet.Class.ClassRowChanged -= Class_ClassRowChanged;
		Select(directed: true, forward: true);
		SaveData();
	}

	private void bindingNavigatorGoto_Click(object sender, EventArgs e)
	{
		if (bindingNavigatorID.Text.Length != 0)
		{
			int num = classBindingSource.Find("ClassID", bindingNavigatorID.Text);
			if (num != -1)
			{
				classBindingSource.Position = num;
			}
		}
	}

	private void bindingNavigatorFilter_CheckedChanged(object sender, EventArgs e)
	{
		if (bindingNavigatorFilter.Checked)
		{
			using (FilterForm filterForm = new FilterForm(classDataGridView))
			{
				if (filterForm.ShowDialog(this) == DialogResult.OK)
				{
					classBindingSource.Filter = filterForm.FilterString;
					if (Program.right == Program.Right.User)
					{
						BindingSource bindingSource = classBindingSource;
						bindingSource.Filter = bindingSource.Filter + " AND ClassID >= " + Settings.Default.minUserClassID;
					}
				}
				else
				{
					bindingNavigatorFilter.Checked = false;
				}
				return;
			}
		}
		if (Program.right == Program.Right.User)
		{
			classBindingSource.Filter = "ClassID >= " + Settings.Default.minUserClassID;
		}
		else
		{
			classBindingSource.RemoveFilter();
		}
	}

	private void classDataGridView_DataError(object sender, DataGridViewDataErrorEventArgs e)
	{
		e.Cancel = true;
	}

	private void classBindingSource_BindingComplete(object sender, BindingCompleteEventArgs e)
	{
		if (e.BindingCompleteContext == BindingCompleteContext.DataSourceUpdate)
		{
			BindingSource bindingSource = sender as BindingSource;
			try
			{
				bindingSource.EndEdit();
			}
			catch (Exception ex)
			{
				MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
				bindingSource.CancelEdit();
			}
		}
	}

	private void P0_TMSFile_toolStripButton_Click(object sender, EventArgs e)
	{
		Program.mf.ShowDialog_TMSfile_Hold(Wizard: false, Spec: false, String: false, Barcode: false, Label: false, PLU: false, Face: false, Dept: false, Class: true, Unit: false, Salesman: false, SP1: false, SP2: false, SP3: false, SP4: false);
	}

	private void P0_Ethernet_toolStripButton_Click(object sender, EventArgs e)
	{
		Program.mf.PopMdiChild_Ethernet_Hold(Wizard: false, Spec: false, String: false, Barcode: false, Label: false, PLU: false, Face: false, Dept: false, Class: true, Unit: false, Salesman: false, SP1: false, SP2: false, SP3: false, SP4: false);
		if (Program.mf.m_netForm.mf_Docked)
		{
			base.WindowState = FormWindowState.Normal;
			Close();
		}
	}

	private void ClassForm_Leave(object sender, EventArgs e)
	{
		classDataGridView.EndEdit();
		classBindingSource.EndEdit();
		if (DataSet_Changed)
		{
			DataSet_Update("Class");
			DataSet_Changed = false;
		}
	}

	private void DeleteSelect()
	{
		foreach (DataGridViewRow selectedRow in classDataGridView.SelectedRows)
		{
			if (selectedRow.DataBoundItem is DataRowView dataRowView)
			{
				dataRowView.Row.Delete();
			}
		}
		try
		{
			classTableAdapter.Update(eCSDataSet.Class);
			DataSet_Changed = true;
		}
		catch (Exception ex)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
		}
	}

	private void bindingNavigatorDeleteItem_Click(object sender, EventArgs e)
	{
		DeleteSelect();
	}

	private void classDataGridView_KeyDown(object sender, KeyEventArgs e)
	{
		if (e.KeyCode == Keys.Delete)
		{
			e.Handled = true;
			DeleteSelect();
		}
	}

	private void labelComboBox_Format(object sender, ListControlConvertEventArgs e)
	{
		DataRowView dataRowView = (DataRowView)e.ListItem;
		if (dataRowView != null)
		{
			e.Value = string.Format("{0} - {1}", dataRowView["LabelID"], dataRowView["Name"]);
		}
	}

	private void barcodeComboBox_Format(object sender, ListControlConvertEventArgs e)
	{
		DataRowView dataRowView = (DataRowView)e.ListItem;
		if (dataRowView != null)
		{
			e.Value = string.Format("{0} - {1}", dataRowView["BarID"], dataRowView["Name"]);
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
		System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(ECS.ClassForm));
		this.splitContainer = new System.Windows.Forms.SplitContainer();
		this.classDataGridView = new System.Windows.Forms.DataGridView();
		this.dataGridViewTextBoxColumn1 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.dataGridViewTextBoxColumn2 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.dataGridViewTextBoxColumn3 = new System.Windows.Forms.DataGridViewComboBoxColumn();
		this.deptBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.eCSDataSet = new ECS.ECSDataSet();
		this.classBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.Print_TableLayoutPanel = new System.Windows.Forms.TableLayoutPanel();
		this.Print_Bill1_Panel = new System.Windows.Forms.Panel();
		this.labelID1ComboBox = new System.Windows.Forms.ComboBox();
		this.labelBindingSource1 = new System.Windows.Forms.BindingSource(this.components);
		this.barT1ComboBox = new System.Windows.Forms.ComboBox();
		this.barcodeBindingSource1 = new System.Windows.Forms.BindingSource(this.components);
		this.barF1NumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.labelID1Label = new System.Windows.Forms.Label();
		this.barF1Label1 = new System.Windows.Forms.Label();
		this.barT1Label1 = new System.Windows.Forms.Label();
		this.Print_Bill2_Panel = new System.Windows.Forms.Panel();
		this.labelID2ComboBox = new System.Windows.Forms.ComboBox();
		this.labelBindingSource2 = new System.Windows.Forms.BindingSource(this.components);
		this.barF2Label1 = new System.Windows.Forms.Label();
		this.barT2Label1 = new System.Windows.Forms.Label();
		this.barT2ComboBox = new System.Windows.Forms.ComboBox();
		this.barcodeBindingSource2 = new System.Windows.Forms.BindingSource(this.components);
		this.barF2NumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.labelID2Label = new System.Windows.Forms.Label();
		this.basic_Panel = new System.Windows.Forms.Panel();
		this.classIDLabel = new System.Windows.Forms.Label();
		this.deptIDComboBox = new System.Windows.Forms.ComboBox();
		this.classIDNumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.deptIDLabel = new System.Windows.Forms.Label();
		this.nameLabel = new System.Windows.Forms.Label();
		this.nameTextBox = new System.Windows.Forms.TextBox();
		this.classTableAdapter = new ECS.ECSDataSetTableAdapters.ClassTableAdapter();
		this.classBindingNavigator = new System.Windows.Forms.BindingNavigator(this.components);
		this.bindingNavigatorAddNewItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorCountItem = new System.Windows.Forms.ToolStripLabel();
		this.bindingNavigatorMoveFirstItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorMovePreviousItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorSeparator = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorPositionItem = new System.Windows.Forms.ToolStripTextBox();
		this.bindingNavigatorSeparator1 = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorMoveNextItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorMoveLastItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorSeparator2 = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorDeleteItem = new System.Windows.Forms.ToolStripButton();
		this.toolStripSeparator1 = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorID = new System.Windows.Forms.ToolStripTextBox();
		this.bindingNavigatorGoto = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorFilter = new System.Windows.Forms.ToolStripButton();
		this.P0_TMSFile_toolStripButton = new System.Windows.Forms.ToolStripButton();
		this.P0_Ethernet_toolStripButton = new System.Windows.Forms.ToolStripButton();
		this.deptTableAdapter = new ECS.ECSDataSetTableAdapters.DeptTableAdapter();
		this.labelTableAdapter = new ECS.ECSDataSetTableAdapters.LabelTableAdapter();
		this.barcodeTableAdapter = new ECS.ECSDataSetTableAdapters.BarcodeTableAdapter();
		this.splitContainer.Panel1.SuspendLayout();
		this.splitContainer.Panel2.SuspendLayout();
		this.splitContainer.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.classDataGridView).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.deptBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.eCSDataSet).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.classBindingSource).BeginInit();
		this.Print_TableLayoutPanel.SuspendLayout();
		this.Print_Bill1_Panel.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.labelBindingSource1).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.barcodeBindingSource1).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.barF1NumericUpDown).BeginInit();
		this.Print_Bill2_Panel.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.labelBindingSource2).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.barcodeBindingSource2).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.barF2NumericUpDown).BeginInit();
		this.basic_Panel.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.classIDNumericUpDown).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.classBindingNavigator).BeginInit();
		this.classBindingNavigator.SuspendLayout();
		base.SuspendLayout();
		this.splitContainer.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		resources.ApplyResources(this.splitContainer, "splitContainer");
		this.splitContainer.Name = "splitContainer";
		resources.ApplyResources(this.splitContainer.Panel1, "splitContainer.Panel1");
		this.splitContainer.Panel1.Controls.Add(this.classDataGridView);
		resources.ApplyResources(this.splitContainer.Panel2, "splitContainer.Panel2");
		this.splitContainer.Panel2.Controls.Add(this.Print_TableLayoutPanel);
		this.classDataGridView.AllowUserToAddRows = false;
		this.classDataGridView.AutoGenerateColumns = false;
		this.classDataGridView.BackgroundColor = System.Drawing.SystemColors.Window;
		this.classDataGridView.BorderStyle = System.Windows.Forms.BorderStyle.None;
		this.classDataGridView.Columns.AddRange(this.dataGridViewTextBoxColumn1, this.dataGridViewTextBoxColumn2, this.dataGridViewTextBoxColumn3);
		this.classDataGridView.DataSource = this.classBindingSource;
		resources.ApplyResources(this.classDataGridView, "classDataGridView");
		this.classDataGridView.Name = "classDataGridView";
		this.classDataGridView.RowTemplate.Height = 23;
		this.classDataGridView.SelectionMode = System.Windows.Forms.DataGridViewSelectionMode.FullRowSelect;
		this.classDataGridView.DataError += new System.Windows.Forms.DataGridViewDataErrorEventHandler(classDataGridView_DataError);
		this.classDataGridView.KeyDown += new System.Windows.Forms.KeyEventHandler(classDataGridView_KeyDown);
		this.dataGridViewTextBoxColumn1.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.dataGridViewTextBoxColumn1.DataPropertyName = "ClassID";
		this.dataGridViewTextBoxColumn1.FillWeight = 60f;
		resources.ApplyResources(this.dataGridViewTextBoxColumn1, "dataGridViewTextBoxColumn1");
		this.dataGridViewTextBoxColumn1.Name = "dataGridViewTextBoxColumn1";
		this.dataGridViewTextBoxColumn2.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.dataGridViewTextBoxColumn2.DataPropertyName = "Name";
		resources.ApplyResources(this.dataGridViewTextBoxColumn2, "dataGridViewTextBoxColumn2");
		this.dataGridViewTextBoxColumn2.Name = "dataGridViewTextBoxColumn2";
		this.dataGridViewTextBoxColumn3.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.dataGridViewTextBoxColumn3.DataPropertyName = "DeptID";
		this.dataGridViewTextBoxColumn3.DataSource = this.deptBindingSource;
		this.dataGridViewTextBoxColumn3.DisplayMember = "Name";
		this.dataGridViewTextBoxColumn3.FillWeight = 60f;
		resources.ApplyResources(this.dataGridViewTextBoxColumn3, "dataGridViewTextBoxColumn3");
		this.dataGridViewTextBoxColumn3.Name = "dataGridViewTextBoxColumn3";
		this.dataGridViewTextBoxColumn3.Resizable = System.Windows.Forms.DataGridViewTriState.True;
		this.dataGridViewTextBoxColumn3.SortMode = System.Windows.Forms.DataGridViewColumnSortMode.Automatic;
		this.dataGridViewTextBoxColumn3.ValueMember = "DeptID";
		this.deptBindingSource.DataMember = "Dept";
		this.deptBindingSource.DataSource = this.eCSDataSet;
		this.deptBindingSource.Sort = "DeptID";
		this.eCSDataSet.DataSetName = "ECSDataSet";
		this.eCSDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		this.classBindingSource.DataMember = "Class";
		this.classBindingSource.DataSource = this.eCSDataSet;
		this.classBindingSource.Sort = "";
		this.classBindingSource.BindingComplete += new System.Windows.Forms.BindingCompleteEventHandler(classBindingSource_BindingComplete);
		resources.ApplyResources(this.Print_TableLayoutPanel, "Print_TableLayoutPanel");
		this.Print_TableLayoutPanel.Controls.Add(this.Print_Bill1_Panel, 0, 1);
		this.Print_TableLayoutPanel.Controls.Add(this.Print_Bill2_Panel, 0, 2);
		this.Print_TableLayoutPanel.Controls.Add(this.basic_Panel, 0, 0);
		this.Print_TableLayoutPanel.Name = "Print_TableLayoutPanel";
		this.Print_Bill1_Panel.Controls.Add(this.labelID1ComboBox);
		this.Print_Bill1_Panel.Controls.Add(this.barT1ComboBox);
		this.Print_Bill1_Panel.Controls.Add(this.barF1NumericUpDown);
		this.Print_Bill1_Panel.Controls.Add(this.labelID1Label);
		this.Print_Bill1_Panel.Controls.Add(this.barF1Label1);
		this.Print_Bill1_Panel.Controls.Add(this.barT1Label1);
		resources.ApplyResources(this.Print_Bill1_Panel, "Print_Bill1_Panel");
		this.Print_Bill1_Panel.Name = "Print_Bill1_Panel";
		this.labelID1ComboBox.DataBindings.Add(new System.Windows.Forms.Binding("SelectedValue", this.classBindingSource, "LabelID1", true));
		this.labelID1ComboBox.DataSource = this.labelBindingSource1;
		this.labelID1ComboBox.DisplayMember = "Name";
		this.labelID1ComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.labelID1ComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.labelID1ComboBox, "labelID1ComboBox");
		this.labelID1ComboBox.Name = "labelID1ComboBox";
		this.labelID1ComboBox.ValueMember = "LabelID";
		this.labelID1ComboBox.Format += new System.Windows.Forms.ListControlConvertEventHandler(labelComboBox_Format);
		this.labelBindingSource1.DataMember = "Label";
		this.labelBindingSource1.DataSource = this.eCSDataSet;
		this.labelBindingSource1.Filter = "LabelID >=0 AND LabelID <= 29";
		this.labelBindingSource1.Sort = "LabelID";
		this.barT1ComboBox.DataBindings.Add(new System.Windows.Forms.Binding("SelectedValue", this.classBindingSource, "BarT1", true));
		this.barT1ComboBox.DataSource = this.barcodeBindingSource1;
		this.barT1ComboBox.DisplayMember = "Name";
		this.barT1ComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.barT1ComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.barT1ComboBox, "barT1ComboBox");
		this.barT1ComboBox.Name = "barT1ComboBox";
		this.barT1ComboBox.ValueMember = "BarID";
		this.barT1ComboBox.Format += new System.Windows.Forms.ListControlConvertEventHandler(barcodeComboBox_Format);
		this.barcodeBindingSource1.DataMember = "Barcode";
		this.barcodeBindingSource1.DataSource = this.eCSDataSet;
		this.barcodeBindingSource1.Sort = "BarID";
		this.barF1NumericUpDown.DataBindings.Add(new System.Windows.Forms.Binding("Value", this.classBindingSource, "BarF1", true));
		resources.ApplyResources(this.barF1NumericUpDown, "barF1NumericUpDown");
		this.barF1NumericUpDown.Maximum = ECS.Properties.Settings.Default.maxBarFlag;
		this.barF1NumericUpDown.Name = "barF1NumericUpDown";
		resources.ApplyResources(this.labelID1Label, "labelID1Label");
		this.labelID1Label.Name = "labelID1Label";
		resources.ApplyResources(this.barF1Label1, "barF1Label1");
		this.barF1Label1.Name = "barF1Label1";
		resources.ApplyResources(this.barT1Label1, "barT1Label1");
		this.barT1Label1.Name = "barT1Label1";
		this.Print_Bill2_Panel.Controls.Add(this.labelID2ComboBox);
		this.Print_Bill2_Panel.Controls.Add(this.barF2Label1);
		this.Print_Bill2_Panel.Controls.Add(this.barT2Label1);
		this.Print_Bill2_Panel.Controls.Add(this.barT2ComboBox);
		this.Print_Bill2_Panel.Controls.Add(this.barF2NumericUpDown);
		this.Print_Bill2_Panel.Controls.Add(this.labelID2Label);
		resources.ApplyResources(this.Print_Bill2_Panel, "Print_Bill2_Panel");
		this.Print_Bill2_Panel.Name = "Print_Bill2_Panel";
		this.labelID2ComboBox.DataBindings.Add(new System.Windows.Forms.Binding("SelectedValue", this.classBindingSource, "LabelID2", true));
		this.labelID2ComboBox.DataSource = this.labelBindingSource2;
		this.labelID2ComboBox.DisplayMember = "Name";
		this.labelID2ComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.labelID2ComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.labelID2ComboBox, "labelID2ComboBox");
		this.labelID2ComboBox.Name = "labelID2ComboBox";
		this.labelID2ComboBox.ValueMember = "LabelID";
		this.labelID2ComboBox.Format += new System.Windows.Forms.ListControlConvertEventHandler(labelComboBox_Format);
		this.labelBindingSource2.DataMember = "Label";
		this.labelBindingSource2.DataSource = this.eCSDataSet;
		this.labelBindingSource2.Filter = "LabelID >=0 AND LabelID <= 29";
		this.labelBindingSource2.Sort = "LabelID";
		resources.ApplyResources(this.barF2Label1, "barF2Label1");
		this.barF2Label1.Name = "barF2Label1";
		resources.ApplyResources(this.barT2Label1, "barT2Label1");
		this.barT2Label1.Name = "barT2Label1";
		this.barT2ComboBox.DataBindings.Add(new System.Windows.Forms.Binding("SelectedValue", this.classBindingSource, "BarT2", true));
		this.barT2ComboBox.DataSource = this.barcodeBindingSource2;
		this.barT2ComboBox.DisplayMember = "Name";
		this.barT2ComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.barT2ComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.barT2ComboBox, "barT2ComboBox");
		this.barT2ComboBox.Name = "barT2ComboBox";
		this.barT2ComboBox.ValueMember = "BarID";
		this.barT2ComboBox.Format += new System.Windows.Forms.ListControlConvertEventHandler(barcodeComboBox_Format);
		this.barcodeBindingSource2.DataMember = "Barcode";
		this.barcodeBindingSource2.DataSource = this.eCSDataSet;
		this.barcodeBindingSource2.Sort = "BarID";
		this.barF2NumericUpDown.DataBindings.Add(new System.Windows.Forms.Binding("Value", this.classBindingSource, "BarF2", true));
		resources.ApplyResources(this.barF2NumericUpDown, "barF2NumericUpDown");
		this.barF2NumericUpDown.Maximum = ECS.Properties.Settings.Default.maxBarFlag;
		this.barF2NumericUpDown.Name = "barF2NumericUpDown";
		resources.ApplyResources(this.labelID2Label, "labelID2Label");
		this.labelID2Label.Name = "labelID2Label";
		this.basic_Panel.Controls.Add(this.classIDLabel);
		this.basic_Panel.Controls.Add(this.deptIDComboBox);
		this.basic_Panel.Controls.Add(this.classIDNumericUpDown);
		this.basic_Panel.Controls.Add(this.deptIDLabel);
		this.basic_Panel.Controls.Add(this.nameLabel);
		this.basic_Panel.Controls.Add(this.nameTextBox);
		resources.ApplyResources(this.basic_Panel, "basic_Panel");
		this.basic_Panel.Name = "basic_Panel";
		resources.ApplyResources(this.classIDLabel, "classIDLabel");
		this.classIDLabel.Name = "classIDLabel";
		this.deptIDComboBox.DataBindings.Add(new System.Windows.Forms.Binding("SelectedValue", this.classBindingSource, "DeptID", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		this.deptIDComboBox.DataSource = this.deptBindingSource;
		this.deptIDComboBox.DisplayMember = "Name";
		this.deptIDComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.deptIDComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.deptIDComboBox, "deptIDComboBox");
		this.deptIDComboBox.Name = "deptIDComboBox";
		this.deptIDComboBox.ValueMember = "DeptID";
		this.deptIDComboBox.Format += new System.Windows.Forms.ListControlConvertEventHandler(deptIDComboBox_Format);
		this.classIDNumericUpDown.DataBindings.Add(new System.Windows.Forms.Binding("Value", this.classBindingSource, "ClassID", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		resources.ApplyResources(this.classIDNumericUpDown, "classIDNumericUpDown");
		this.classIDNumericUpDown.Maximum = ECS.Properties.Settings.Default.maxClassID;
		this.classIDNumericUpDown.Name = "classIDNumericUpDown";
		resources.ApplyResources(this.deptIDLabel, "deptIDLabel");
		this.deptIDLabel.Name = "deptIDLabel";
		resources.ApplyResources(this.nameLabel, "nameLabel");
		this.nameLabel.Name = "nameLabel";
		this.nameTextBox.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.classBindingSource, "Name", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		resources.ApplyResources(this.nameTextBox, "nameTextBox");
		this.nameTextBox.Name = "nameTextBox";
		this.classTableAdapter.ClearBeforeFill = true;
		this.classBindingNavigator.AddNewItem = this.bindingNavigatorAddNewItem;
		this.classBindingNavigator.BindingSource = this.classBindingSource;
		this.classBindingNavigator.CountItem = this.bindingNavigatorCountItem;
		this.classBindingNavigator.DeleteItem = null;
		this.classBindingNavigator.Items.AddRange(new System.Windows.Forms.ToolStripItem[17]
		{
			this.bindingNavigatorMoveFirstItem, this.bindingNavigatorMovePreviousItem, this.bindingNavigatorSeparator, this.bindingNavigatorPositionItem, this.bindingNavigatorCountItem, this.bindingNavigatorSeparator1, this.bindingNavigatorMoveNextItem, this.bindingNavigatorMoveLastItem, this.bindingNavigatorSeparator2, this.bindingNavigatorAddNewItem,
			this.bindingNavigatorDeleteItem, this.toolStripSeparator1, this.bindingNavigatorID, this.bindingNavigatorGoto, this.bindingNavigatorFilter, this.P0_TMSFile_toolStripButton, this.P0_Ethernet_toolStripButton
		});
		resources.ApplyResources(this.classBindingNavigator, "classBindingNavigator");
		this.classBindingNavigator.MoveFirstItem = this.bindingNavigatorMoveFirstItem;
		this.classBindingNavigator.MoveLastItem = this.bindingNavigatorMoveLastItem;
		this.classBindingNavigator.MoveNextItem = this.bindingNavigatorMoveNextItem;
		this.classBindingNavigator.MovePreviousItem = this.bindingNavigatorMovePreviousItem;
		this.classBindingNavigator.Name = "classBindingNavigator";
		this.classBindingNavigator.PositionItem = this.bindingNavigatorPositionItem;
		this.bindingNavigatorAddNewItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorAddNewItem.Image = ECS.Properties.Resources.bindingNavigatorAddNewItem;
		this.bindingNavigatorAddNewItem.Name = "bindingNavigatorAddNewItem";
		resources.ApplyResources(this.bindingNavigatorAddNewItem, "bindingNavigatorAddNewItem");
		this.bindingNavigatorCountItem.Name = "bindingNavigatorCountItem";
		resources.ApplyResources(this.bindingNavigatorCountItem, "bindingNavigatorCountItem");
		this.bindingNavigatorMoveFirstItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorMoveFirstItem.Image = ECS.Properties.Resources.bindingNavigatorMoveFirstItem;
		this.bindingNavigatorMoveFirstItem.Name = "bindingNavigatorMoveFirstItem";
		resources.ApplyResources(this.bindingNavigatorMoveFirstItem, "bindingNavigatorMoveFirstItem");
		this.bindingNavigatorMovePreviousItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorMovePreviousItem.Image = ECS.Properties.Resources.bindingNavigatorMovePreviousItem;
		this.bindingNavigatorMovePreviousItem.Name = "bindingNavigatorMovePreviousItem";
		resources.ApplyResources(this.bindingNavigatorMovePreviousItem, "bindingNavigatorMovePreviousItem");
		this.bindingNavigatorSeparator.Name = "bindingNavigatorSeparator";
		resources.ApplyResources(this.bindingNavigatorSeparator, "bindingNavigatorSeparator");
		resources.ApplyResources(this.bindingNavigatorPositionItem, "bindingNavigatorPositionItem");
		this.bindingNavigatorPositionItem.Name = "bindingNavigatorPositionItem";
		this.bindingNavigatorSeparator1.Name = "bindingNavigatorSeparator1";
		resources.ApplyResources(this.bindingNavigatorSeparator1, "bindingNavigatorSeparator1");
		this.bindingNavigatorMoveNextItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorMoveNextItem.Image = ECS.Properties.Resources.bindingNavigatorMoveNextItem;
		this.bindingNavigatorMoveNextItem.Name = "bindingNavigatorMoveNextItem";
		resources.ApplyResources(this.bindingNavigatorMoveNextItem, "bindingNavigatorMoveNextItem");
		this.bindingNavigatorMoveLastItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorMoveLastItem.Image = ECS.Properties.Resources.bindingNavigatorMoveLastItem;
		this.bindingNavigatorMoveLastItem.Name = "bindingNavigatorMoveLastItem";
		resources.ApplyResources(this.bindingNavigatorMoveLastItem, "bindingNavigatorMoveLastItem");
		this.bindingNavigatorSeparator2.Name = "bindingNavigatorSeparator2";
		resources.ApplyResources(this.bindingNavigatorSeparator2, "bindingNavigatorSeparator2");
		this.bindingNavigatorDeleteItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorDeleteItem.Image = ECS.Properties.Resources.bindingNavigatorDeleteItem;
		this.bindingNavigatorDeleteItem.Name = "bindingNavigatorDeleteItem";
		resources.ApplyResources(this.bindingNavigatorDeleteItem, "bindingNavigatorDeleteItem");
		this.bindingNavigatorDeleteItem.Click += new System.EventHandler(bindingNavigatorDeleteItem_Click);
		this.toolStripSeparator1.Name = "toolStripSeparator1";
		resources.ApplyResources(this.toolStripSeparator1, "toolStripSeparator1");
		this.bindingNavigatorID.Name = "bindingNavigatorID";
		resources.ApplyResources(this.bindingNavigatorID, "bindingNavigatorID");
		this.bindingNavigatorGoto.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorGoto.Image = ECS.Properties.Resources.bindingNavigatorGoto;
		resources.ApplyResources(this.bindingNavigatorGoto, "bindingNavigatorGoto");
		this.bindingNavigatorGoto.Name = "bindingNavigatorGoto";
		this.bindingNavigatorGoto.Click += new System.EventHandler(bindingNavigatorGoto_Click);
		this.bindingNavigatorFilter.CheckOnClick = true;
		this.bindingNavigatorFilter.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorFilter.Image = ECS.Properties.Resources.bindingNavigatorFilter;
		resources.ApplyResources(this.bindingNavigatorFilter, "bindingNavigatorFilter");
		this.bindingNavigatorFilter.Name = "bindingNavigatorFilter";
		this.bindingNavigatorFilter.CheckedChanged += new System.EventHandler(bindingNavigatorFilter_CheckedChanged);
		resources.ApplyResources(this.P0_TMSFile_toolStripButton, "P0_TMSFile_toolStripButton");
		this.P0_TMSFile_toolStripButton.Name = "P0_TMSFile_toolStripButton";
		this.P0_TMSFile_toolStripButton.Click += new System.EventHandler(P0_TMSFile_toolStripButton_Click);
		resources.ApplyResources(this.P0_Ethernet_toolStripButton, "P0_Ethernet_toolStripButton");
		this.P0_Ethernet_toolStripButton.Name = "P0_Ethernet_toolStripButton";
		this.P0_Ethernet_toolStripButton.Click += new System.EventHandler(P0_Ethernet_toolStripButton_Click);
		this.deptTableAdapter.ClearBeforeFill = true;
		this.labelTableAdapter.ClearBeforeFill = true;
		this.barcodeTableAdapter.ClearBeforeFill = true;
		resources.ApplyResources(this, "$this");
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		base.Controls.Add(this.splitContainer);
		base.Controls.Add(this.classBindingNavigator);
		base.Name = "ClassForm";
		base.FormClosing += new System.Windows.Forms.FormClosingEventHandler(ClassForm_FormClosing);
		base.Load += new System.EventHandler(ClassForm_Load);
		base.Leave += new System.EventHandler(ClassForm_Leave);
		this.splitContainer.Panel1.ResumeLayout(false);
		this.splitContainer.Panel2.ResumeLayout(false);
		this.splitContainer.ResumeLayout(false);
		((System.ComponentModel.ISupportInitialize)this.classDataGridView).EndInit();
		((System.ComponentModel.ISupportInitialize)this.deptBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.eCSDataSet).EndInit();
		((System.ComponentModel.ISupportInitialize)this.classBindingSource).EndInit();
		this.Print_TableLayoutPanel.ResumeLayout(false);
		this.Print_Bill1_Panel.ResumeLayout(false);
		this.Print_Bill1_Panel.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.labelBindingSource1).EndInit();
		((System.ComponentModel.ISupportInitialize)this.barcodeBindingSource1).EndInit();
		((System.ComponentModel.ISupportInitialize)this.barF1NumericUpDown).EndInit();
		this.Print_Bill2_Panel.ResumeLayout(false);
		this.Print_Bill2_Panel.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.labelBindingSource2).EndInit();
		((System.ComponentModel.ISupportInitialize)this.barcodeBindingSource2).EndInit();
		((System.ComponentModel.ISupportInitialize)this.barF2NumericUpDown).EndInit();
		this.basic_Panel.ResumeLayout(false);
		this.basic_Panel.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.classIDNumericUpDown).EndInit();
		((System.ComponentModel.ISupportInitialize)this.classBindingNavigator).EndInit();
		this.classBindingNavigator.ResumeLayout(false);
		this.classBindingNavigator.PerformLayout();
		base.ResumeLayout(false);
		base.PerformLayout();
	}
}

using System;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Globalization;
using System.Windows.Forms;
using ECS.ECSDataSetTableAdapters;
using ECS.Properties;

namespace ECS;

public class UnitForm : Form
{
	private delegate void DataSet_RefreshCallback(string Type);

	private bool NoCTRowChanged;

	private bool DataSet_Changed;

	private IContainer components;

	private ECSDataSet eCSDataSet;

	private BindingSource unitBindingSource;

	private UnitTableAdapter unitTableAdapter;

	private BindingNavigator unitBindingNavigator;

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

	private DataGridView unitDataGridView;

	private TextBox nameTextBox;

	private NumericUpDown unitIDNumericUpDown;

	private NumericUpDown packNumericUpDown;

	private UIDataSet uIDataSet;

	private ToolStripSeparator toolStripSeparator1;

	private ToolStripTextBox bindingNavigatorID;

	private ToolStripButton bindingNavigatorGoto;

	private ToolStripButton bindingNavigatorFilter;

	private ComboBox punitComboBox;

	private BindingSource unit_TypeBindingSource;

	private DataGridViewTextBoxColumn dataGridViewTextBoxColumn1;

	private DataGridViewTextBoxColumn dataGridViewTextBoxColumn4;

	private DataGridViewComboBoxColumn Punit;

	private DataGridViewTextBoxColumn dataGridViewTextBoxColumn3;

	private ToolStripButton P0_TMSFile_toolStripButton;

	private ToolStripButton P0_Ethernet_toolStripButton;

	private Label punitLabel;

	private Label packLabel1;

	private Label unitIDLabel;

	private Label nameLabel;

	public UnitForm()
	{
		InitializeComponent();
	}

	public void DataSet_Refresh(string Type)
	{
		if (base.InvokeRequired)
		{
			Invoke(new DataSet_RefreshCallback(DataSet_Refresh), Type);
		}
		else if (Type == "Unit")
		{
			NoCTRowChanged = true;
			eCSDataSet.Unit.Clear();
			unitTableAdapter.Fill(eCSDataSet.Unit);
			unitBindingSource.ResetBindings(metadataChanged: false);
			NoCTRowChanged = false;
		}
	}

	private void DataSet_Update(string Type)
	{
		Program.mf.DataSet_Update(Type, "UnitForm");
	}

	private void UnitForm_Load(object sender, EventArgs e)
	{
		Text = Program.GetLang("pw_Unit");
		bindingNavigatorAddNewItem.Text = Program.GetLang("pw_AddNew");
		bindingNavigatorDeleteItem.Text = Program.GetLang("pw_Delete");
		bindingNavigatorFilter.Text = Program.GetLang("pw_Filter");
		bindingNavigatorGoto.Text = Program.GetLang("pw_Switchto");
		bindingNavigatorMoveFirstItem.Text = Program.GetLang("pw_FirstRecord");
		bindingNavigatorMoveLastItem.Text = Program.GetLang("pw_LastRecord");
		bindingNavigatorMoveNextItem.Text = Program.GetLang("pw_NextRecord");
		bindingNavigatorMovePreviousItem.Text = Program.GetLang("pw_PreviousRecord");
		dataGridViewTextBoxColumn1.HeaderText = Program.GetLang("pw_Number");
		dataGridViewTextBoxColumn3.HeaderText = Program.GetLang("pw_Package");
		dataGridViewTextBoxColumn4.HeaderText = Program.GetLang("pw_Name");
		nameLabel.Text = Program.GetLang("pw_Name") + ":";
		P0_Ethernet_toolStripButton.Text = Program.GetLang("pw_Ethernet");
		P0_TMSFile_toolStripButton.Text = Program.GetLang("pw_TMSFile");
		packLabel1.Text = Program.GetLang("pw_MeasureUnit_sl_");
		Punit.HeaderText = Program.GetLang("pw_BaseUnit");
		punitLabel.Text = Program.GetLang("pw_BaseUnit") + ":";
		unitIDLabel.Text = Program.GetLang("pw_Number") + ":";
		Font = Settings.Default.CustomFont;
		if (Program.right == Program.Right.User)
		{
			unitBindingSource.Filter = "UnitID >= " + Settings.Default.minUserUnitID;
			ComboBox comboBox = punitComboBox;
			bool enabled = (packNumericUpDown.Enabled = false);
			comboBox.Enabled = enabled;
			DataGridViewComboBoxColumn punit = Punit;
			bool readOnly = (dataGridViewTextBoxColumn3.ReadOnly = true);
			punit.ReadOnly = readOnly;
		}
		string fileName = Application.StartupPath + "\\Combo.xml";
		uIDataSet.Unit_Type.ReadXml(fileName);
		unitTableAdapter.Fill(eCSDataSet.Unit);
		eCSDataSet.Unit.UnitRowChanged += Unit_UnitRowChanged;
	}

	private void Unit_UnitRowChanged(object sender, ECSDataSet.UnitRowChangeEvent e)
	{
		if (NoCTRowChanged || e.Action == DataRowAction.Rollback || e.Action == DataRowAction.Commit)
		{
			return;
		}
		if (e.Row.UnitID > Settings.Default.maxUnitID)
		{
			e.Row.RejectChanges();
			return;
		}
		if (e.Row.UnitID < Settings.Default.minUserUnitID && Program.right == Program.Right.User)
		{
			e.Row.RejectChanges();
			return;
		}
		try
		{
			unitTableAdapter.Update(eCSDataSet.Unit);
			DataSet_Changed = true;
		}
		catch (Exception ex)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
		}
	}

	public void SaveData()
	{
		Validate();
		try
		{
			unitBindingSource.EndEdit();
		}
		catch (Exception ex)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			unitBindingSource.CancelEdit();
		}
		if (eCSDataSet.HasChanges())
		{
			try
			{
				unitTableAdapter.Update(eCSDataSet.Unit);
				DataSet_Changed = true;
			}
			catch (Exception ex2)
			{
				MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex2.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			}
		}
	}

	private void UnitForm_FormClosing(object sender, FormClosingEventArgs e)
	{
		eCSDataSet.Unit.UnitRowChanged -= Unit_UnitRowChanged;
		Select(directed: true, forward: true);
		SaveData();
	}

	private void typeComboBox_Format(object sender, ListControlConvertEventArgs e)
	{
		DataRowView dataRowView = (DataRowView)e.ListItem;
		if (dataRowView != null)
		{
			e.Value = string.Format("{0} - {1}", dataRowView["Value"], dataRowView["Display"]);
		}
	}

	private void bindingNavigatorGoto_Click(object sender, EventArgs e)
	{
		if (bindingNavigatorID.Text.Length != 0)
		{
			int num = unitBindingSource.Find("UnitID", bindingNavigatorID.Text);
			if (num != -1)
			{
				unitBindingSource.Position = num;
			}
		}
	}

	private void bindingNavigatorFilter_CheckedChanged(object sender, EventArgs e)
	{
		if (bindingNavigatorFilter.Checked)
		{
			using (FilterForm filterForm = new FilterForm(unitDataGridView))
			{
				if (filterForm.ShowDialog(this) == DialogResult.OK)
				{
					unitBindingSource.Filter = filterForm.FilterString;
					if (Program.right == Program.Right.User)
					{
						BindingSource bindingSource = unitBindingSource;
						bindingSource.Filter = bindingSource.Filter + " AND DeptID >= " + Settings.Default.minUserDeptID;
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
			unitBindingSource.Filter = "UnitID >= " + Settings.Default.minUserUnitID;
		}
		else
		{
			unitBindingSource.RemoveFilter();
		}
	}

	private void unitDataGridView_DataError(object sender, DataGridViewDataErrorEventArgs e)
	{
		e.Cancel = true;
	}

	private void unitBindingSource_BindingComplete(object sender, BindingCompleteEventArgs e)
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
		Program.mf.ShowDialog_TMSfile_Hold(Wizard: false, Spec: false, String: false, Barcode: false, Label: false, PLU: false, Face: false, Dept: false, Class: false, Unit: true, Salesman: false, SP1: false, SP2: false, SP3: false, SP4: false);
	}

	private void P0_Ethernet_toolStripButton_Click(object sender, EventArgs e)
	{
		Program.mf.PopMdiChild_Ethernet_Hold(Wizard: false, Spec: false, String: false, Barcode: false, Label: false, PLU: false, Face: false, Dept: false, Class: false, Unit: true, Salesman: false, SP1: false, SP2: false, SP3: false, SP4: false);
		if (Program.mf.m_netForm.mf_Docked)
		{
			base.WindowState = FormWindowState.Normal;
			Close();
		}
	}

	private void UnitForm_Leave(object sender, EventArgs e)
	{
		unitDataGridView.EndEdit();
		unitBindingSource.EndEdit();
		if (DataSet_Changed)
		{
			DataSet_Update("Unit");
			DataSet_Changed = false;
		}
	}

	private void DeleteSelect()
	{
		foreach (DataGridViewRow selectedRow in unitDataGridView.SelectedRows)
		{
			if (selectedRow.DataBoundItem is DataRowView dataRowView)
			{
				dataRowView.Row.Delete();
			}
		}
		try
		{
			unitTableAdapter.Update(eCSDataSet.Unit);
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

	private void unitDataGridView_KeyDown(object sender, KeyEventArgs e)
	{
		if (e.KeyCode == Keys.Delete)
		{
			e.Handled = true;
			DeleteSelect();
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
		System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(ECS.UnitForm));
		this.splitContainer = new System.Windows.Forms.SplitContainer();
		this.unitDataGridView = new System.Windows.Forms.DataGridView();
		this.dataGridViewTextBoxColumn1 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.dataGridViewTextBoxColumn4 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.Punit = new System.Windows.Forms.DataGridViewComboBoxColumn();
		this.unit_TypeBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.uIDataSet = new ECS.UIDataSet();
		this.dataGridViewTextBoxColumn3 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.unitBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.eCSDataSet = new ECS.ECSDataSet();
		this.punitLabel = new System.Windows.Forms.Label();
		this.punitComboBox = new System.Windows.Forms.ComboBox();
		this.packLabel1 = new System.Windows.Forms.Label();
		this.packNumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.unitIDLabel = new System.Windows.Forms.Label();
		this.unitIDNumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.nameLabel = new System.Windows.Forms.Label();
		this.nameTextBox = new System.Windows.Forms.TextBox();
		this.unitBindingNavigator = new System.Windows.Forms.BindingNavigator(this.components);
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
		this.unitTableAdapter = new ECS.ECSDataSetTableAdapters.UnitTableAdapter();
		this.splitContainer.Panel1.SuspendLayout();
		this.splitContainer.Panel2.SuspendLayout();
		this.splitContainer.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.unitDataGridView).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.unit_TypeBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.uIDataSet).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.unitBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.eCSDataSet).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.packNumericUpDown).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.unitIDNumericUpDown).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.unitBindingNavigator).BeginInit();
		this.unitBindingNavigator.SuspendLayout();
		base.SuspendLayout();
		this.splitContainer.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		resources.ApplyResources(this.splitContainer, "splitContainer");
		this.splitContainer.Name = "splitContainer";
		resources.ApplyResources(this.splitContainer.Panel1, "splitContainer.Panel1");
		this.splitContainer.Panel1.Controls.Add(this.unitDataGridView);
		resources.ApplyResources(this.splitContainer.Panel2, "splitContainer.Panel2");
		this.splitContainer.Panel2.Controls.Add(this.punitLabel);
		this.splitContainer.Panel2.Controls.Add(this.punitComboBox);
		this.splitContainer.Panel2.Controls.Add(this.packLabel1);
		this.splitContainer.Panel2.Controls.Add(this.packNumericUpDown);
		this.splitContainer.Panel2.Controls.Add(this.unitIDLabel);
		this.splitContainer.Panel2.Controls.Add(this.unitIDNumericUpDown);
		this.splitContainer.Panel2.Controls.Add(this.nameLabel);
		this.splitContainer.Panel2.Controls.Add(this.nameTextBox);
		this.unitDataGridView.AllowUserToAddRows = false;
		this.unitDataGridView.AutoGenerateColumns = false;
		this.unitDataGridView.BackgroundColor = System.Drawing.SystemColors.Window;
		this.unitDataGridView.BorderStyle = System.Windows.Forms.BorderStyle.None;
		this.unitDataGridView.Columns.AddRange(this.dataGridViewTextBoxColumn1, this.dataGridViewTextBoxColumn4, this.Punit, this.dataGridViewTextBoxColumn3);
		this.unitDataGridView.DataSource = this.unitBindingSource;
		resources.ApplyResources(this.unitDataGridView, "unitDataGridView");
		this.unitDataGridView.Name = "unitDataGridView";
		this.unitDataGridView.RowTemplate.Height = 23;
		this.unitDataGridView.SelectionMode = System.Windows.Forms.DataGridViewSelectionMode.FullRowSelect;
		this.unitDataGridView.DataError += new System.Windows.Forms.DataGridViewDataErrorEventHandler(unitDataGridView_DataError);
		this.unitDataGridView.KeyDown += new System.Windows.Forms.KeyEventHandler(unitDataGridView_KeyDown);
		this.dataGridViewTextBoxColumn1.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.dataGridViewTextBoxColumn1.DataPropertyName = "UnitID";
		resources.ApplyResources(this.dataGridViewTextBoxColumn1, "dataGridViewTextBoxColumn1");
		this.dataGridViewTextBoxColumn1.Name = "dataGridViewTextBoxColumn1";
		this.dataGridViewTextBoxColumn4.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.dataGridViewTextBoxColumn4.DataPropertyName = "Name";
		resources.ApplyResources(this.dataGridViewTextBoxColumn4, "dataGridViewTextBoxColumn4");
		this.dataGridViewTextBoxColumn4.Name = "dataGridViewTextBoxColumn4";
		this.Punit.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.Punit.DataPropertyName = "Punit";
		this.Punit.DataSource = this.unit_TypeBindingSource;
		this.Punit.DisplayMember = "Display";
		resources.ApplyResources(this.Punit, "Punit");
		this.Punit.Name = "Punit";
		this.Punit.ValueMember = "Value";
		this.unit_TypeBindingSource.DataMember = "Unit_Type";
		this.unit_TypeBindingSource.DataSource = this.uIDataSet;
		this.uIDataSet.DataSetName = "UIDataSet";
		this.uIDataSet.Locale = new System.Globalization.CultureInfo("zh-CN");
		this.uIDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		this.dataGridViewTextBoxColumn3.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.dataGridViewTextBoxColumn3.DataPropertyName = "Pack";
		resources.ApplyResources(this.dataGridViewTextBoxColumn3, "dataGridViewTextBoxColumn3");
		this.dataGridViewTextBoxColumn3.Name = "dataGridViewTextBoxColumn3";
		this.unitBindingSource.DataMember = "Unit";
		this.unitBindingSource.DataSource = this.eCSDataSet;
		this.unitBindingSource.Sort = "";
		this.unitBindingSource.BindingComplete += new System.Windows.Forms.BindingCompleteEventHandler(unitBindingSource_BindingComplete);
		this.eCSDataSet.DataSetName = "ECSDataSet";
		this.eCSDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		resources.ApplyResources(this.punitLabel, "punitLabel");
		this.punitLabel.Name = "punitLabel";
		this.punitComboBox.DataBindings.Add(new System.Windows.Forms.Binding("SelectedValue", this.unitBindingSource, "Punit", true));
		this.punitComboBox.DataSource = this.unit_TypeBindingSource;
		this.punitComboBox.DisplayMember = "Display";
		this.punitComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.punitComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.punitComboBox, "punitComboBox");
		this.punitComboBox.Name = "punitComboBox";
		this.punitComboBox.ValueMember = "Value";
		this.punitComboBox.Format += new System.Windows.Forms.ListControlConvertEventHandler(typeComboBox_Format);
		resources.ApplyResources(this.packLabel1, "packLabel1");
		this.packLabel1.Name = "packLabel1";
		this.packNumericUpDown.DataBindings.Add(new System.Windows.Forms.Binding("Value", this.unitBindingSource, "Pack", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		this.packNumericUpDown.DecimalPlaces = ECS.Properties.Settings.Default.Format_Weight;
		resources.ApplyResources(this.packNumericUpDown, "packNumericUpDown");
		this.packNumericUpDown.Maximum = ECS.Properties.Settings.Default.maxUnitPack;
		this.packNumericUpDown.Name = "packNumericUpDown";
		resources.ApplyResources(this.unitIDLabel, "unitIDLabel");
		this.unitIDLabel.Name = "unitIDLabel";
		this.unitIDNumericUpDown.DataBindings.Add(new System.Windows.Forms.Binding("Value", this.unitBindingSource, "UnitID", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		resources.ApplyResources(this.unitIDNumericUpDown, "unitIDNumericUpDown");
		this.unitIDNumericUpDown.Maximum = ECS.Properties.Settings.Default.maxUnitID;
		this.unitIDNumericUpDown.Name = "unitIDNumericUpDown";
		resources.ApplyResources(this.nameLabel, "nameLabel");
		this.nameLabel.Name = "nameLabel";
		this.nameTextBox.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.unitBindingSource, "Name", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		resources.ApplyResources(this.nameTextBox, "nameTextBox");
		this.nameTextBox.Name = "nameTextBox";
		this.unitBindingNavigator.AddNewItem = this.bindingNavigatorAddNewItem;
		this.unitBindingNavigator.BindingSource = this.unitBindingSource;
		this.unitBindingNavigator.CountItem = this.bindingNavigatorCountItem;
		this.unitBindingNavigator.DeleteItem = null;
		this.unitBindingNavigator.Items.AddRange(new System.Windows.Forms.ToolStripItem[17]
		{
			this.bindingNavigatorMoveFirstItem, this.bindingNavigatorMovePreviousItem, this.bindingNavigatorSeparator, this.bindingNavigatorPositionItem, this.bindingNavigatorCountItem, this.bindingNavigatorSeparator1, this.bindingNavigatorMoveNextItem, this.bindingNavigatorMoveLastItem, this.bindingNavigatorSeparator2, this.bindingNavigatorAddNewItem,
			this.bindingNavigatorDeleteItem, this.toolStripSeparator1, this.bindingNavigatorID, this.bindingNavigatorGoto, this.bindingNavigatorFilter, this.P0_TMSFile_toolStripButton, this.P0_Ethernet_toolStripButton
		});
		resources.ApplyResources(this.unitBindingNavigator, "unitBindingNavigator");
		this.unitBindingNavigator.MoveFirstItem = this.bindingNavigatorMoveFirstItem;
		this.unitBindingNavigator.MoveLastItem = this.bindingNavigatorMoveLastItem;
		this.unitBindingNavigator.MoveNextItem = this.bindingNavigatorMoveNextItem;
		this.unitBindingNavigator.MovePreviousItem = this.bindingNavigatorMovePreviousItem;
		this.unitBindingNavigator.Name = "unitBindingNavigator";
		this.unitBindingNavigator.PositionItem = this.bindingNavigatorPositionItem;
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
		this.unitTableAdapter.ClearBeforeFill = true;
		resources.ApplyResources(this, "$this");
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		base.Controls.Add(this.splitContainer);
		base.Controls.Add(this.unitBindingNavigator);
		base.Name = "UnitForm";
		base.FormClosing += new System.Windows.Forms.FormClosingEventHandler(UnitForm_FormClosing);
		base.Load += new System.EventHandler(UnitForm_Load);
		base.Leave += new System.EventHandler(UnitForm_Leave);
		this.splitContainer.Panel1.ResumeLayout(false);
		this.splitContainer.Panel2.ResumeLayout(false);
		this.splitContainer.Panel2.PerformLayout();
		this.splitContainer.ResumeLayout(false);
		((System.ComponentModel.ISupportInitialize)this.unitDataGridView).EndInit();
		((System.ComponentModel.ISupportInitialize)this.unit_TypeBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.uIDataSet).EndInit();
		((System.ComponentModel.ISupportInitialize)this.unitBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.eCSDataSet).EndInit();
		((System.ComponentModel.ISupportInitialize)this.packNumericUpDown).EndInit();
		((System.ComponentModel.ISupportInitialize)this.unitIDNumericUpDown).EndInit();
		((System.ComponentModel.ISupportInitialize)this.unitBindingNavigator).EndInit();
		this.unitBindingNavigator.ResumeLayout(false);
		this.unitBindingNavigator.PerformLayout();
		base.ResumeLayout(false);
		base.PerformLayout();
	}
}

using System;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Windows.Forms;
using ECS.ECSDataSetTableAdapters;
using ECS.Properties;

namespace ECS;

public class Co_BoxPcsForm : Form
{
	private delegate void DataSet_RefreshCallback(string Type);

	private IContainer components;

	private ReportDataSet reportDataSet;

	private ECSDataSet ecsDataSet;

	private PLUTableAdapter pluTableAdapter;

	private BindingSource PLU1_BindingSource;

	private BindingSource PLU2_BindingSource;

	private SplitContainer splitContainer1;

	private NumericUpDown AddMulti_NumericUpDown;

	private Label label1;

	private ComboBox AddPLU2_ComboBox;

	private BindingSource PLU4_BindingSource;

	private ComboBox AddPLU1_ComboBox;

	private BindingSource PLU3_BindingSource;

	private DataGridView BoxPcs_DataGridView;

	private BindingNavigator coPLU_BindingNavigator;

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

	private Button exeButton;

	private Button cancelButton;

	private Label Error_Label;

	private DataGridViewComboBoxColumn pLUIDBoxDataGridViewComboBoxColumn;

	private DataGridViewTextBoxColumn multiDataGridViewTextBoxColumn;

	private DataGridViewComboBoxColumn pLUIDPcsDataGridViewComboBoxColumn;

	private BindingSource coPLU_BoxPcsBindingSource;

	private CoPLU_BoxPcsTableAdapter coPLU_BoxPcsTableAdapter;

	public Co_BoxPcsForm()
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
			PLU1_BindingSource.ResetBindings(metadataChanged: false);
			PLU2_BindingSource.ResetBindings(metadataChanged: false);
			PLU3_BindingSource.ResetBindings(metadataChanged: false);
			PLU4_BindingSource.ResetBindings(metadataChanged: false);
		}
	}

	private void AddPLU_ComboBox_Format(object sender, ListControlConvertEventArgs e)
	{
		DataRowView dataRowView = (DataRowView)e.ListItem;
		if (dataRowView != null)
		{
			e.Value = string.Format("{0} - {1}", dataRowView["PLUID"], dataRowView["Name"]);
		}
	}

	private void BoxPcsForm_Load(object sender, EventArgs e)
	{
		Text = Program.GetLang("pw_PiecesInPackage");
		ToolStripButton toolStripButton = bindingNavigatorAddNewItem;
		string text = (exeButton.Text = Program.GetLang("pw_AddNew"));
		toolStripButton.Text = text;
		bindingNavigatorDeleteItem.Text = Program.GetLang("pw_Delete");
		cancelButton.Text = Program.GetLang("pw_Cancel");
		pLUIDBoxDataGridViewComboBoxColumn.HeaderText = Program.GetLang("pw_PackagePLU");
		pLUIDPcsDataGridViewComboBoxColumn.HeaderText = Program.GetLang("pw_PiecesPLU");
		bindingNavigatorMoveFirstItem.Text = Program.GetLang("pw_FirstRecord");
		bindingNavigatorMoveLastItem.Text = Program.GetLang("pw_LastRecord");
		bindingNavigatorMoveNextItem.Text = Program.GetLang("pw_NextRecord");
		bindingNavigatorMovePreviousItem.Text = Program.GetLang("pw_PreviousRecord");
		pluTableAdapter.Fill(ecsDataSet.PLU);
		RDS.DataSet_Init_Unit(ref ecsDataSet);
		foreach (ECSDataSet.PLURow item in ecsDataSet.PLU)
		{
			item.Name = item.PLUID + " - " + item.Name;
		}
		coPLU_BoxPcsTableAdapter.Fill(ecsDataSet.CoPLU_BoxPcs);
		splitContainer1.Panel2Collapsed = true;
	}

	private ECSDataSet.CoPLU_BoxPcsRow GetCurrent_BoxPcsRow()
	{
		if (coPLU_BoxPcsBindingSource.Position == -1)
		{
			return null;
		}
		DataRowView dataRowView = (DataRowView)coPLU_BoxPcsBindingSource.Current;
		return (ECSDataSet.CoPLU_BoxPcsRow)dataRowView.Row;
	}

	private void Delete_Button_Click(object sender, EventArgs e)
	{
		BoxPcs_DataGridView.Rows.Remove(BoxPcs_DataGridView.CurrentRow);
	}

	private void bindingNavigatorAddNewItem_Click(object sender, EventArgs e)
	{
		splitContainer1.Panel1.Enabled = false;
		splitContainer1.Panel2Collapsed = false;
		AddPLU1_ComboBox.SelectedIndex = -1;
		AddPLU2_ComboBox.SelectedIndex = -1;
		AddMulti_NumericUpDown.Value = 2m;
	}

	private void cancelButton_Click(object sender, EventArgs e)
	{
		splitContainer1.Panel1.Enabled = true;
		splitContainer1.Panel2Collapsed = true;
	}

	private void exeButton_Click(object sender, EventArgs e)
	{
		ECSDataSet.CoPLU_BoxPcsRow coPLU_BoxPcsRow = ecsDataSet.CoPLU_BoxPcs.NewCoPLU_BoxPcsRow();
		coPLU_BoxPcsRow.PLUID_Box = (int)AddPLU1_ComboBox.SelectedValue;
		coPLU_BoxPcsRow.PLUID_Pcs = (int)AddPLU2_ComboBox.SelectedValue;
		coPLU_BoxPcsRow.Multi = (int)AddMulti_NumericUpDown.Value;
		ecsDataSet.CoPLU_BoxPcs.AddCoPLU_BoxPcsRow(coPLU_BoxPcsRow);
		splitContainer1.Panel1.Enabled = true;
		splitContainer1.Panel2Collapsed = true;
	}

	private void AddPLU1_ComboBox_SelectedValueChanged(object sender, EventArgs e)
	{
		try
		{
			int num = (int)AddPLU1_ComboBox.SelectedValue;
			int num2 = (int)AddPLU2_ComboBox.SelectedValue;
			if (num == num2)
			{
				Error_Label.Text = Program.GetLang("pw_PackagePLUMustDifferToPiecesPLU");
				exeButton.Enabled = false;
				return;
			}
			if (ecsDataSet.CoPLU_BoxPcs.FindByPLUID_Box(num) != null)
			{
				Error_Label.Text = Program.GetLang("pw_PackagePLUExist");
				exeButton.Enabled = false;
				return;
			}
			if (ecsDataSet.Unit.FindByUnitID(ecsDataSet.PLU.FindByPLUID(num).UnitID).Punit == 1 || ecsDataSet.Unit.FindByUnitID(ecsDataSet.PLU.FindByPLUID(num2).UnitID).Punit == 1)
			{
				Error_Label.Text = Program.GetLang("pw_PackagePLUAndPiecesPLUMustBeByCountPLU");
				exeButton.Enabled = false;
				return;
			}
			int num3 = 10;
			int num4 = num2;
			while (true)
			{
				ECSDataSet.CoPLU_BoxPcsRow coPLU_BoxPcsRow = ecsDataSet.CoPLU_BoxPcs.FindByPLUID_Box(num4);
				if (coPLU_BoxPcsRow == null)
				{
					Error_Label.Text = "";
					exeButton.Enabled = true;
					return;
				}
				num4 = coPLU_BoxPcsRow.PLUID_Pcs;
				if (num4 == num || num4 == num2 || num3 <= 0)
				{
					break;
				}
				num3--;
			}
			Error_Label.Text = Program.GetLang("pw_Collision");
			exeButton.Enabled = false;
		}
		catch
		{
			Error_Label.Text = Program.GetLang("pw_SelectPackagePLUAndPiecesPLU");
			exeButton.Enabled = false;
		}
	}

	private void DataSet_Update(string Type)
	{
		Program.mf.DataSet_Update(Type, "Co_BoxPcsForm");
	}

	public void SaveData()
	{
		Validate();
		try
		{
			coPLU_BoxPcsBindingSource.EndEdit();
		}
		catch (Exception ex)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			coPLU_BoxPcsBindingSource.CancelEdit();
		}
		if (ecsDataSet.HasChanges())
		{
			try
			{
				coPLU_BoxPcsTableAdapter.Update(ecsDataSet.CoPLU_BoxPcs);
				DataSet_Update("CoPLU_BoxPcs");
			}
			catch (Exception ex2)
			{
				MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex2.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			}
		}
	}

	private void BoxPcsForm_FormClosing(object sender, FormClosingEventArgs e)
	{
		SaveData();
	}

	private void BoxPcs_DataGridView_DataError(object sender, DataGridViewDataErrorEventArgs e)
	{
		e.Cancel = true;
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
		System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(ECS.Co_BoxPcsForm));
		this.reportDataSet = new ECS.ReportDataSet();
		this.ecsDataSet = new ECS.ECSDataSet();
		this.pluTableAdapter = new ECS.ECSDataSetTableAdapters.PLUTableAdapter();
		this.PLU1_BindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.PLU2_BindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.splitContainer1 = new System.Windows.Forms.SplitContainer();
		this.BoxPcs_DataGridView = new System.Windows.Forms.DataGridView();
		this.pLUIDBoxDataGridViewComboBoxColumn = new System.Windows.Forms.DataGridViewComboBoxColumn();
		this.multiDataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.pLUIDPcsDataGridViewComboBoxColumn = new System.Windows.Forms.DataGridViewComboBoxColumn();
		this.coPLU_BoxPcsBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.coPLU_BindingNavigator = new System.Windows.Forms.BindingNavigator(this.components);
		this.bindingNavigatorCountItem = new System.Windows.Forms.ToolStripLabel();
		this.bindingNavigatorDeleteItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorMoveFirstItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorMovePreviousItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorSeparator = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorPositionItem = new System.Windows.Forms.ToolStripTextBox();
		this.bindingNavigatorSeparator1 = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorMoveNextItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorMoveLastItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorSeparator2 = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorAddNewItem = new System.Windows.Forms.ToolStripButton();
		this.Error_Label = new System.Windows.Forms.Label();
		this.exeButton = new System.Windows.Forms.Button();
		this.cancelButton = new System.Windows.Forms.Button();
		this.AddMulti_NumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.label1 = new System.Windows.Forms.Label();
		this.AddPLU2_ComboBox = new System.Windows.Forms.ComboBox();
		this.PLU4_BindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.AddPLU1_ComboBox = new System.Windows.Forms.ComboBox();
		this.PLU3_BindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.coPLU_BoxPcsTableAdapter = new ECS.ECSDataSetTableAdapters.CoPLU_BoxPcsTableAdapter();
		((System.ComponentModel.ISupportInitialize)this.reportDataSet).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.ecsDataSet).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.PLU1_BindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.PLU2_BindingSource).BeginInit();
		this.splitContainer1.Panel1.SuspendLayout();
		this.splitContainer1.Panel2.SuspendLayout();
		this.splitContainer1.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.BoxPcs_DataGridView).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.coPLU_BoxPcsBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.coPLU_BindingNavigator).BeginInit();
		this.coPLU_BindingNavigator.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.AddMulti_NumericUpDown).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.PLU4_BindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.PLU3_BindingSource).BeginInit();
		base.SuspendLayout();
		this.reportDataSet.DataSetName = "ReportDataSet";
		this.reportDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		this.ecsDataSet.DataSetName = "ECSDataSet";
		this.ecsDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		this.pluTableAdapter.ClearBeforeFill = true;
		this.PLU1_BindingSource.AllowNew = false;
		this.PLU1_BindingSource.DataMember = "PLU";
		this.PLU1_BindingSource.DataSource = this.ecsDataSet;
		this.PLU2_BindingSource.AllowNew = false;
		this.PLU2_BindingSource.DataMember = "PLU";
		this.PLU2_BindingSource.DataSource = this.ecsDataSet;
		this.splitContainer1.Dock = System.Windows.Forms.DockStyle.Fill;
		this.splitContainer1.Location = new System.Drawing.Point(0, 0);
		this.splitContainer1.Name = "splitContainer1";
		this.splitContainer1.Orientation = System.Windows.Forms.Orientation.Horizontal;
		this.splitContainer1.Panel1.Controls.Add(this.BoxPcs_DataGridView);
		this.splitContainer1.Panel1.Controls.Add(this.coPLU_BindingNavigator);
		this.splitContainer1.Panel2.Controls.Add(this.Error_Label);
		this.splitContainer1.Panel2.Controls.Add(this.exeButton);
		this.splitContainer1.Panel2.Controls.Add(this.cancelButton);
		this.splitContainer1.Panel2.Controls.Add(this.AddMulti_NumericUpDown);
		this.splitContainer1.Panel2.Controls.Add(this.label1);
		this.splitContainer1.Panel2.Controls.Add(this.AddPLU2_ComboBox);
		this.splitContainer1.Panel2.Controls.Add(this.AddPLU1_ComboBox);
		this.splitContainer1.Size = new System.Drawing.Size(707, 500);
		this.splitContainer1.SplitterDistance = 413;
		this.splitContainer1.TabIndex = 1;
		this.BoxPcs_DataGridView.AllowUserToAddRows = false;
		this.BoxPcs_DataGridView.AllowUserToResizeColumns = false;
		this.BoxPcs_DataGridView.AutoGenerateColumns = false;
		this.BoxPcs_DataGridView.BackgroundColor = System.Drawing.SystemColors.Window;
		this.BoxPcs_DataGridView.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		this.BoxPcs_DataGridView.ColumnHeadersHeightSizeMode = System.Windows.Forms.DataGridViewColumnHeadersHeightSizeMode.AutoSize;
		this.BoxPcs_DataGridView.Columns.AddRange(this.pLUIDBoxDataGridViewComboBoxColumn, this.multiDataGridViewTextBoxColumn, this.pLUIDPcsDataGridViewComboBoxColumn);
		this.BoxPcs_DataGridView.DataSource = this.coPLU_BoxPcsBindingSource;
		this.BoxPcs_DataGridView.Dock = System.Windows.Forms.DockStyle.Fill;
		this.BoxPcs_DataGridView.Location = new System.Drawing.Point(0, 25);
		this.BoxPcs_DataGridView.Name = "BoxPcs_DataGridView";
		this.BoxPcs_DataGridView.RowHeadersWidth = 20;
		this.BoxPcs_DataGridView.RowTemplate.Height = 23;
		this.BoxPcs_DataGridView.SelectionMode = System.Windows.Forms.DataGridViewSelectionMode.FullRowSelect;
		this.BoxPcs_DataGridView.Size = new System.Drawing.Size(707, 388);
		this.BoxPcs_DataGridView.TabIndex = 0;
		this.BoxPcs_DataGridView.DataError += new System.Windows.Forms.DataGridViewDataErrorEventHandler(BoxPcs_DataGridView_DataError);
		this.pLUIDBoxDataGridViewComboBoxColumn.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.pLUIDBoxDataGridViewComboBoxColumn.DataPropertyName = "PLUID_Box";
		this.pLUIDBoxDataGridViewComboBoxColumn.DataSource = this.PLU1_BindingSource;
		this.pLUIDBoxDataGridViewComboBoxColumn.DisplayMember = "Name";
		this.pLUIDBoxDataGridViewComboBoxColumn.HeaderText = "Box";
		this.pLUIDBoxDataGridViewComboBoxColumn.Name = "pLUIDBoxDataGridViewComboBoxColumn";
		this.pLUIDBoxDataGridViewComboBoxColumn.ReadOnly = true;
		this.pLUIDBoxDataGridViewComboBoxColumn.ValueMember = "PLUID";
		this.multiDataGridViewTextBoxColumn.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.multiDataGridViewTextBoxColumn.DataPropertyName = "Multi";
		this.multiDataGridViewTextBoxColumn.FillWeight = 30f;
		this.multiDataGridViewTextBoxColumn.HeaderText = "×";
		this.multiDataGridViewTextBoxColumn.Name = "multiDataGridViewTextBoxColumn";
		this.pLUIDPcsDataGridViewComboBoxColumn.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.pLUIDPcsDataGridViewComboBoxColumn.DataPropertyName = "PLUID_Pcs";
		this.pLUIDPcsDataGridViewComboBoxColumn.DataSource = this.PLU2_BindingSource;
		this.pLUIDPcsDataGridViewComboBoxColumn.DisplayMember = "Name";
		this.pLUIDPcsDataGridViewComboBoxColumn.HeaderText = "Pcs";
		this.pLUIDPcsDataGridViewComboBoxColumn.Name = "pLUIDPcsDataGridViewComboBoxColumn";
		this.pLUIDPcsDataGridViewComboBoxColumn.ReadOnly = true;
		this.pLUIDPcsDataGridViewComboBoxColumn.ValueMember = "PLUID";
		this.coPLU_BoxPcsBindingSource.AllowNew = true;
		this.coPLU_BoxPcsBindingSource.DataMember = "CoPLU_BoxPcs";
		this.coPLU_BoxPcsBindingSource.DataSource = this.ecsDataSet;
		this.coPLU_BindingNavigator.AddNewItem = null;
		this.coPLU_BindingNavigator.BindingSource = this.coPLU_BoxPcsBindingSource;
		this.coPLU_BindingNavigator.CountItem = this.bindingNavigatorCountItem;
		this.coPLU_BindingNavigator.DeleteItem = this.bindingNavigatorDeleteItem;
		this.coPLU_BindingNavigator.Items.AddRange(new System.Windows.Forms.ToolStripItem[11]
		{
			this.bindingNavigatorMoveFirstItem, this.bindingNavigatorMovePreviousItem, this.bindingNavigatorSeparator, this.bindingNavigatorPositionItem, this.bindingNavigatorCountItem, this.bindingNavigatorSeparator1, this.bindingNavigatorMoveNextItem, this.bindingNavigatorMoveLastItem, this.bindingNavigatorSeparator2, this.bindingNavigatorAddNewItem,
			this.bindingNavigatorDeleteItem
		});
		this.coPLU_BindingNavigator.Location = new System.Drawing.Point(0, 0);
		this.coPLU_BindingNavigator.MoveFirstItem = this.bindingNavigatorMoveFirstItem;
		this.coPLU_BindingNavigator.MoveLastItem = this.bindingNavigatorMoveLastItem;
		this.coPLU_BindingNavigator.MoveNextItem = this.bindingNavigatorMoveNextItem;
		this.coPLU_BindingNavigator.MovePreviousItem = this.bindingNavigatorMovePreviousItem;
		this.coPLU_BindingNavigator.Name = "coPLU_BindingNavigator";
		this.coPLU_BindingNavigator.PositionItem = this.bindingNavigatorPositionItem;
		this.coPLU_BindingNavigator.Size = new System.Drawing.Size(707, 25);
		this.coPLU_BindingNavigator.TabIndex = 1;
		this.coPLU_BindingNavigator.Text = "bindingNavigator1";
		this.bindingNavigatorCountItem.Name = "bindingNavigatorCountItem";
		this.bindingNavigatorCountItem.Size = new System.Drawing.Size(35, 22);
		this.bindingNavigatorCountItem.Text = "/ {0}";
		this.bindingNavigatorDeleteItem.Image = (System.Drawing.Image)resources.GetObject("bindingNavigatorDeleteItem.Image");
		this.bindingNavigatorDeleteItem.Name = "bindingNavigatorDeleteItem";
		this.bindingNavigatorDeleteItem.RightToLeftAutoMirrorImage = true;
		this.bindingNavigatorDeleteItem.Size = new System.Drawing.Size(49, 22);
		this.bindingNavigatorDeleteItem.Text = "删除";
		this.bindingNavigatorMoveFirstItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorMoveFirstItem.Image = (System.Drawing.Image)resources.GetObject("bindingNavigatorMoveFirstItem.Image");
		this.bindingNavigatorMoveFirstItem.Name = "bindingNavigatorMoveFirstItem";
		this.bindingNavigatorMoveFirstItem.RightToLeftAutoMirrorImage = true;
		this.bindingNavigatorMoveFirstItem.Size = new System.Drawing.Size(23, 22);
		this.bindingNavigatorMoveFirstItem.Text = "移到第一条记录";
		this.bindingNavigatorMovePreviousItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorMovePreviousItem.Image = (System.Drawing.Image)resources.GetObject("bindingNavigatorMovePreviousItem.Image");
		this.bindingNavigatorMovePreviousItem.Name = "bindingNavigatorMovePreviousItem";
		this.bindingNavigatorMovePreviousItem.RightToLeftAutoMirrorImage = true;
		this.bindingNavigatorMovePreviousItem.Size = new System.Drawing.Size(23, 22);
		this.bindingNavigatorMovePreviousItem.Text = "移到上一条记录";
		this.bindingNavigatorSeparator.Name = "bindingNavigatorSeparator";
		this.bindingNavigatorSeparator.Size = new System.Drawing.Size(6, 25);
		this.bindingNavigatorPositionItem.AccessibleName = "位置";
		this.bindingNavigatorPositionItem.AutoSize = false;
		this.bindingNavigatorPositionItem.Name = "bindingNavigatorPositionItem";
		this.bindingNavigatorPositionItem.Size = new System.Drawing.Size(50, 21);
		this.bindingNavigatorPositionItem.Text = "0";
		this.bindingNavigatorSeparator1.Name = "bindingNavigatorSeparator1";
		this.bindingNavigatorSeparator1.Size = new System.Drawing.Size(6, 25);
		this.bindingNavigatorMoveNextItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorMoveNextItem.Image = (System.Drawing.Image)resources.GetObject("bindingNavigatorMoveNextItem.Image");
		this.bindingNavigatorMoveNextItem.Name = "bindingNavigatorMoveNextItem";
		this.bindingNavigatorMoveNextItem.RightToLeftAutoMirrorImage = true;
		this.bindingNavigatorMoveNextItem.Size = new System.Drawing.Size(23, 22);
		this.bindingNavigatorMoveNextItem.Text = "移到下一条记录";
		this.bindingNavigatorMoveLastItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorMoveLastItem.Image = (System.Drawing.Image)resources.GetObject("bindingNavigatorMoveLastItem.Image");
		this.bindingNavigatorMoveLastItem.Name = "bindingNavigatorMoveLastItem";
		this.bindingNavigatorMoveLastItem.RightToLeftAutoMirrorImage = true;
		this.bindingNavigatorMoveLastItem.Size = new System.Drawing.Size(23, 22);
		this.bindingNavigatorMoveLastItem.Text = "移到最后一条记录";
		this.bindingNavigatorSeparator2.Name = "bindingNavigatorSeparator2";
		this.bindingNavigatorSeparator2.Size = new System.Drawing.Size(6, 25);
		this.bindingNavigatorAddNewItem.Image = (System.Drawing.Image)resources.GetObject("bindingNavigatorAddNewItem.Image");
		this.bindingNavigatorAddNewItem.Name = "bindingNavigatorAddNewItem";
		this.bindingNavigatorAddNewItem.RightToLeftAutoMirrorImage = true;
		this.bindingNavigatorAddNewItem.Size = new System.Drawing.Size(49, 22);
		this.bindingNavigatorAddNewItem.Text = "新添";
		this.bindingNavigatorAddNewItem.Click += new System.EventHandler(bindingNavigatorAddNewItem_Click);
		this.Error_Label.AutoSize = true;
		this.Error_Label.ForeColor = System.Drawing.Color.Red;
		this.Error_Label.Location = new System.Drawing.Point(22, 48);
		this.Error_Label.Name = "Error_Label";
		this.Error_Label.Size = new System.Drawing.Size(41, 12);
		this.Error_Label.TabIndex = 22;
		this.Error_Label.Text = "label2";
		this.exeButton.Enabled = false;
		this.exeButton.ImeMode = System.Windows.Forms.ImeMode.NoControl;
		this.exeButton.Location = new System.Drawing.Point(310, 48);
		this.exeButton.Name = "exeButton";
		this.exeButton.Size = new System.Drawing.Size(120, 23);
		this.exeButton.TabIndex = 20;
		this.exeButton.Text = "exeButton";
		this.exeButton.UseVisualStyleBackColor = true;
		this.exeButton.Click += new System.EventHandler(exeButton_Click);
		this.cancelButton.ImeMode = System.Windows.Forms.ImeMode.NoControl;
		this.cancelButton.Location = new System.Drawing.Point(447, 48);
		this.cancelButton.Name = "cancelButton";
		this.cancelButton.Size = new System.Drawing.Size(120, 23);
		this.cancelButton.TabIndex = 21;
		this.cancelButton.Text = "cancelButton";
		this.cancelButton.UseVisualStyleBackColor = true;
		this.cancelButton.Click += new System.EventHandler(cancelButton_Click);
		this.AddMulti_NumericUpDown.Location = new System.Drawing.Point(272, 16);
		this.AddMulti_NumericUpDown.Maximum = new decimal(new int[4] { 9999999, 0, 0, 0 });
		this.AddMulti_NumericUpDown.Minimum = new decimal(new int[4] { 2, 0, 0, 0 });
		this.AddMulti_NumericUpDown.Name = "AddMulti_NumericUpDown";
		this.AddMulti_NumericUpDown.Size = new System.Drawing.Size(94, 21);
		this.AddMulti_NumericUpDown.TabIndex = 3;
		this.AddMulti_NumericUpDown.Value = new decimal(new int[4] { 2, 0, 0, 0 });
		this.label1.AutoSize = true;
		this.label1.Location = new System.Drawing.Point(241, 20);
		this.label1.Name = "label1";
		this.label1.Size = new System.Drawing.Size(11, 12);
		this.label1.TabIndex = 2;
		this.label1.Text = "=";
		this.AddPLU2_ComboBox.DataSource = this.PLU4_BindingSource;
		this.AddPLU2_ComboBox.DisplayMember = "Name";
		this.AddPLU2_ComboBox.FormattingEnabled = true;
		this.AddPLU2_ComboBox.Location = new System.Drawing.Point(372, 16);
		this.AddPLU2_ComboBox.Name = "AddPLU2_ComboBox";
		this.AddPLU2_ComboBox.Size = new System.Drawing.Size(195, 20);
		this.AddPLU2_ComboBox.TabIndex = 1;
		this.AddPLU2_ComboBox.ValueMember = "PLUID";
		this.AddPLU2_ComboBox.Format += new System.Windows.Forms.ListControlConvertEventHandler(AddPLU_ComboBox_Format);
		this.AddPLU2_ComboBox.SelectedValueChanged += new System.EventHandler(AddPLU1_ComboBox_SelectedValueChanged);
		this.PLU4_BindingSource.AllowNew = false;
		this.PLU4_BindingSource.DataMember = "PLU";
		this.PLU4_BindingSource.DataSource = this.ecsDataSet;
		this.PLU4_BindingSource.Filter = "UnitID=2";
		this.PLU4_BindingSource.Sort = "";
		this.AddPLU1_ComboBox.DataSource = this.PLU3_BindingSource;
		this.AddPLU1_ComboBox.DisplayMember = "Name";
		this.AddPLU1_ComboBox.FormattingEnabled = true;
		this.AddPLU1_ComboBox.Location = new System.Drawing.Point(20, 16);
		this.AddPLU1_ComboBox.Name = "AddPLU1_ComboBox";
		this.AddPLU1_ComboBox.Size = new System.Drawing.Size(205, 20);
		this.AddPLU1_ComboBox.TabIndex = 1;
		this.AddPLU1_ComboBox.ValueMember = "PLUID";
		this.AddPLU1_ComboBox.Format += new System.Windows.Forms.ListControlConvertEventHandler(AddPLU_ComboBox_Format);
		this.AddPLU1_ComboBox.SelectedValueChanged += new System.EventHandler(AddPLU1_ComboBox_SelectedValueChanged);
		this.PLU3_BindingSource.AllowNew = false;
		this.PLU3_BindingSource.DataMember = "PLU";
		this.PLU3_BindingSource.DataSource = this.ecsDataSet;
		this.PLU3_BindingSource.Filter = "UnitID=2";
		this.PLU3_BindingSource.Sort = "";
		this.coPLU_BoxPcsTableAdapter.ClearBeforeFill = true;
		base.AutoScaleDimensions = new System.Drawing.SizeF(6f, 12f);
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		base.ClientSize = new System.Drawing.Size(707, 500);
		base.Controls.Add(this.splitContainer1);
		base.MaximizeBox = false;
		base.MinimizeBox = false;
		base.Name = "Co_BoxPcsForm";
		base.ShowIcon = false;
		base.ShowInTaskbar = false;
		base.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
		this.Text = "BoxPcsForm";
		base.FormClosing += new System.Windows.Forms.FormClosingEventHandler(BoxPcsForm_FormClosing);
		base.Load += new System.EventHandler(BoxPcsForm_Load);
		((System.ComponentModel.ISupportInitialize)this.reportDataSet).EndInit();
		((System.ComponentModel.ISupportInitialize)this.ecsDataSet).EndInit();
		((System.ComponentModel.ISupportInitialize)this.PLU1_BindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.PLU2_BindingSource).EndInit();
		this.splitContainer1.Panel1.ResumeLayout(false);
		this.splitContainer1.Panel1.PerformLayout();
		this.splitContainer1.Panel2.ResumeLayout(false);
		this.splitContainer1.Panel2.PerformLayout();
		this.splitContainer1.ResumeLayout(false);
		((System.ComponentModel.ISupportInitialize)this.BoxPcs_DataGridView).EndInit();
		((System.ComponentModel.ISupportInitialize)this.coPLU_BoxPcsBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.coPLU_BindingNavigator).EndInit();
		this.coPLU_BindingNavigator.ResumeLayout(false);
		this.coPLU_BindingNavigator.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.AddMulti_NumericUpDown).EndInit();
		((System.ComponentModel.ISupportInitialize)this.PLU4_BindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.PLU3_BindingSource).EndInit();
		base.ResumeLayout(false);
	}
}

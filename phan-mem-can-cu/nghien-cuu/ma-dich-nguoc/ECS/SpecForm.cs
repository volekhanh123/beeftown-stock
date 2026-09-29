using System;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Globalization;
using System.Windows.Forms;
using ECS.ECSDataSetTableAdapters;
using ECS.Properties;

namespace ECS;

public class SpecForm : Form
{
	private delegate void DataSet_RefreshCallback(string Type);

	private class SpecCombo
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

	private IContainer components;

	private ECSDataSet eCSDataSet;

	private BindingSource specBindingSource;

	private SpecTableAdapter specTableAdapter;

	private BindingNavigator specBindingNavigator;

	private ToolStripLabel bindingNavigatorCountItem;

	private ToolStripButton bindingNavigatorMoveFirstItem;

	private ToolStripButton bindingNavigatorMovePreviousItem;

	private ToolStripSeparator bindingNavigatorSeparator;

	private ToolStripTextBox bindingNavigatorPositionItem;

	private ToolStripSeparator bindingNavigatorSeparator1;

	private ToolStripButton bindingNavigatorMoveNextItem;

	private ToolStripButton bindingNavigatorMoveLastItem;

	private UIDataSet uIDataSet;

	private BindingSource specInfoBindingSource;

	private DataGridView specDataGridView;

	private ToolStripSeparator toolStripSeparator1;

	private ToolStripButton validToolStripButton;

	private ToolStripButton P0_TMSFile_toolStripButton;

	private ToolStripButton P0_Ethernet_toolStripButton;

	private DataGridViewTextBoxColumn dataGridViewTextBoxColumn1;

	private DataGridViewTextBoxColumn Display;

	private DataGridViewTextBoxColumn dataGridViewTextBoxColumn2;

	private DataGridViewTextBoxColumn Value;

	private DataGridViewCheckBoxColumn Valid;

	private ToolStripTextBox bindingNavigatorDisplay;

	public SpecForm()
	{
		InitializeComponent();
	}

	private string GetDisplay(int id)
	{
		int num = specInfoBindingSource.Find("SpecID", id);
		if (num == -1)
		{
			return string.Empty;
		}
		DataRowView dataRowView = (DataRowView)specInfoBindingSource[num];
		UIDataSet.Spec_InfoRow spec_InfoRow = (UIDataSet.Spec_InfoRow)dataRowView.Row;
		return spec_InfoRow.Display;
	}

	private int GetType(int id)
	{
		int num = specInfoBindingSource.Find("SpecID", id);
		if (num == -1)
		{
			return -1;
		}
		DataRowView dataRowView = (DataRowView)specInfoBindingSource[num];
		UIDataSet.Spec_InfoRow spec_InfoRow = (UIDataSet.Spec_InfoRow)dataRowView.Row;
		return spec_InfoRow.Type;
	}

	private bool GetVisible(int id)
	{
		int num = specInfoBindingSource.Find("SpecID", id);
		if (num == -1)
		{
			return false;
		}
		DataRowView dataRowView = (DataRowView)specInfoBindingSource[num];
		UIDataSet.Spec_InfoRow spec_InfoRow = (UIDataSet.Spec_InfoRow)dataRowView.Row;
		if (Program.right == Program.Right.SuperAdmin)
		{
			return true;
		}
		if (Program.right == Program.Right.Admin)
		{
			if (!(spec_InfoRow.Visible.ToLower() == "true"))
			{
				return spec_InfoRow.Visible.ToLower() == "admin";
			}
			return true;
		}
		return spec_InfoRow.Visible.ToLower() == "true";
	}

	public void DataSet_Refresh(string Type)
	{
		if (base.InvokeRequired)
		{
			Invoke(new DataSet_RefreshCallback(DataSet_Refresh), Type);
		}
		else if (Type == "Spec")
		{
			eCSDataSet.Spec.Clear();
			specTableAdapter.Fill(eCSDataSet.Spec);
			specBindingSource.ResetBindings(metadataChanged: false);
		}
	}

	private void SpecForm_Load(object sender, EventArgs e)
	{
		Text = Program.GetLang("pw_GlobalSpec");
		bindingNavigatorMoveFirstItem.Text = Program.GetLang("pw_FirstRecord");
		bindingNavigatorMoveLastItem.Text = Program.GetLang("pw_LastRecord");
		bindingNavigatorMoveNextItem.Text = Program.GetLang("pw_NextRecord");
		bindingNavigatorMovePreviousItem.Text = Program.GetLang("pw_PreviousRecord");
		dataGridViewTextBoxColumn1.HeaderText = Program.GetLang("pw_Number");
		dataGridViewTextBoxColumn2.HeaderText = Program.GetLang("pw_Value");
		bindingNavigatorDisplay.ToolTipText = Program.GetLang("pw_Filter");
		Display.HeaderText = Program.GetLang("pw_Description");
		P0_Ethernet_toolStripButton.Text = Program.GetLang("pw_Ethernet");
		P0_TMSFile_toolStripButton.Text = Program.GetLang("pw_TMSFile");
		Valid.HeaderText = Program.GetLang("pw_Import_Export");
		validToolStripButton.Text = Program.GetLang("pw_Import_ExportAll");
		Font = Settings.Default.CustomFont;
		ToolStripButton toolStripButton = validToolStripButton;
		bool visible = (toolStripSeparator1.Visible = Program.right == Program.Right.SuperAdmin);
		toolStripButton.Visible = visible;
		string fileName = Application.StartupPath + "\\Tm.xml";
		uIDataSet.Spec_Info.ReadXml(fileName);
		specTableAdapter.Fill(eCSDataSet.Spec);
		foreach (ECSDataSet.SpecRow item in eCSDataSet.Spec)
		{
			item.BeginEdit();
			item.Display = GetDisplay(item.SpecID);
			item.Visible = GetVisible(item.SpecID);
			if (!item.Visible)
			{
				item.Valid = false;
			}
			item.EndEdit();
		}
		try
		{
			specTableAdapter.Update(eCSDataSet.Spec);
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
			specBindingSource.EndEdit();
		}
		catch (Exception ex)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			specBindingSource.CancelEdit();
		}
		if (eCSDataSet.HasChanges())
		{
			try
			{
				specTableAdapter.Update(eCSDataSet.Spec);
			}
			catch (Exception ex2)
			{
				MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex2.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			}
		}
	}

	private void SpecForm_FormClosing(object sender, FormClosingEventArgs e)
	{
		SaveData();
	}

	private void specDataGridView_RowsAdded(object sender, DataGridViewRowsAddedEventArgs e)
	{
		for (int i = e.RowIndex; i < e.RowIndex + e.RowCount; i++)
		{
			int id = (int)specDataGridView[0, i].Value;
			int type = GetType(id);
			string display = GetDisplay(id);
			if (type == 1)
			{
				specDataGridView[1, i].Value = display.Split('|')[0];
			}
			else
			{
				specDataGridView[1, i].Value = display;
			}
			switch (type)
			{
			case 0:
			{
				DataGridViewTextBoxCell value3 = new DataGridViewTextBoxCell();
				specDataGridView[2, i] = value3;
				specDataGridView[2, i].Value = specDataGridView[3, i].Value;
				specDataGridView[2, i].ValueType = specDataGridView[3, i].ValueType;
				break;
			}
			case 1:
			{
				string[] array = display.Split('|');
				SpecCombo[] array2 = new SpecCombo[array.Length / 2];
				for (int j = 0; j < array.Length / 2; j++)
				{
					SpecCombo specCombo = new SpecCombo();
					specCombo.Value = int.Parse(array[j * 2 + 1]);
					specCombo.Display = array[j * 2 + 2];
					array2[j] = specCombo;
				}
				DataGridViewComboBoxCell dataGridViewComboBoxCell = new DataGridViewComboBoxCell();
				dataGridViewComboBoxCell.DisplayMember = "Display";
				dataGridViewComboBoxCell.ValueMember = "Value";
				dataGridViewComboBoxCell.DataSource = array2;
				specDataGridView[2, i] = dataGridViewComboBoxCell;
				specDataGridView[2, i].Value = specDataGridView[3, i].Value;
				specDataGridView[2, i].ValueType = specDataGridView[3, i].ValueType;
				break;
			}
			case 2:
			{
				DataGridViewCheckBoxCell value2 = new DataGridViewCheckBoxCell();
				specDataGridView[2, i] = value2;
				specDataGridView[2, i].Value = specDataGridView[3, i].Value;
				specDataGridView[2, i].ValueType = specDataGridView[3, i].ValueType;
				break;
			}
			case 3:
			{
				DataGridViewTextBoxCell value = new DataGridViewTextBoxCell();
				specDataGridView[2, i] = value;
				specDataGridView[2, i].ValueType = Type.GetType("System.Decimal");
				specDataGridView[2, i].Value = Program.IntInDecimal((int)specDataGridView[3, i].Value);
				break;
			}
			}
		}
	}

	private void specDataGridView_CellValueChanged(object sender, DataGridViewCellEventArgs e)
	{
		if (e.RowIndex != -1 && e.ColumnIndex == 2)
		{
			if (specDataGridView[e.ColumnIndex, e.RowIndex].ValueType == Type.GetType("System.Decimal"))
			{
				int num = Program.DecimalInInt((decimal)specDataGridView[2, e.RowIndex].Value);
				specDataGridView[3, e.RowIndex].Value = num;
				specDataGridView[2, e.RowIndex].Value = Program.IntInDecimal(num);
			}
			else
			{
				specDataGridView[3, e.RowIndex].Value = specDataGridView[2, e.RowIndex].Value;
			}
		}
	}

	private void specDataGridView_DataError(object sender, DataGridViewDataErrorEventArgs e)
	{
		e.Cancel = true;
	}

	private void validToolStripButton_Click(object sender, EventArgs e)
	{
		bool flag = !validToolStripButton.Checked;
		validToolStripButton.Checked = flag;
		foreach (DataRowView item in specBindingSource)
		{
			ECSDataSet.SpecRow specRow = (ECSDataSet.SpecRow)item.Row;
			specRow.Valid = flag;
		}
		try
		{
			specTableAdapter.Update(eCSDataSet.Spec);
		}
		catch (Exception ex)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
		}
	}

	private void P0_TMSFile_toolStripButton_Click(object sender, EventArgs e)
	{
		Program.mf.ShowDialog_TMSfile_Hold(Wizard: false, Spec: true, String: false, Barcode: false, Label: false, PLU: false, Face: false, Dept: false, Class: false, Unit: false, Salesman: false, SP1: false, SP2: false, SP3: false, SP4: false);
	}

	private void P0_Ethernet_toolStripButton_Click(object sender, EventArgs e)
	{
		Program.mf.PopMdiChild_Ethernet_Hold(Wizard: false, Spec: true, String: false, Barcode: false, Label: false, PLU: false, Face: false, Dept: false, Class: false, Unit: false, Salesman: false, SP1: false, SP2: false, SP3: false, SP4: false);
		if (Program.mf.m_netForm.mf_Docked)
		{
			base.WindowState = FormWindowState.Normal;
			Close();
		}
	}

	private void bindingNavigatorDisplay_KeyDown(object sender, KeyEventArgs e)
	{
		if (e.KeyCode != Keys.Return)
		{
			return;
		}
		e.Handled = true;
		string text = "Visible";
		string[] array = bindingNavigatorDisplay.Text.Split(' ');
		string[] array2 = array;
		foreach (string text2 in array2)
		{
			if (text2 != "")
			{
				text += $" AND [Display] LIKE '%{text2}%'";
			}
		}
		specBindingSource.Filter = text;
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
		System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(ECS.SpecForm));
		this.specBindingNavigator = new System.Windows.Forms.BindingNavigator(this.components);
		this.specBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.eCSDataSet = new ECS.ECSDataSet();
		this.bindingNavigatorCountItem = new System.Windows.Forms.ToolStripLabel();
		this.bindingNavigatorMoveFirstItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorMovePreviousItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorSeparator = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorPositionItem = new System.Windows.Forms.ToolStripTextBox();
		this.bindingNavigatorSeparator1 = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorMoveNextItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorMoveLastItem = new System.Windows.Forms.ToolStripButton();
		this.toolStripSeparator1 = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorDisplay = new System.Windows.Forms.ToolStripTextBox();
		this.validToolStripButton = new System.Windows.Forms.ToolStripButton();
		this.P0_TMSFile_toolStripButton = new System.Windows.Forms.ToolStripButton();
		this.P0_Ethernet_toolStripButton = new System.Windows.Forms.ToolStripButton();
		this.uIDataSet = new ECS.UIDataSet();
		this.specInfoBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.specDataGridView = new System.Windows.Forms.DataGridView();
		this.dataGridViewTextBoxColumn1 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.Display = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.dataGridViewTextBoxColumn2 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.Value = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.Valid = new System.Windows.Forms.DataGridViewCheckBoxColumn();
		this.specTableAdapter = new ECS.ECSDataSetTableAdapters.SpecTableAdapter();
		((System.ComponentModel.ISupportInitialize)this.specBindingNavigator).BeginInit();
		this.specBindingNavigator.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.specBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.eCSDataSet).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.uIDataSet).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.specInfoBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.specDataGridView).BeginInit();
		base.SuspendLayout();
		this.specBindingNavigator.AddNewItem = null;
		this.specBindingNavigator.BindingSource = this.specBindingSource;
		this.specBindingNavigator.CountItem = this.bindingNavigatorCountItem;
		this.specBindingNavigator.DeleteItem = null;
		this.specBindingNavigator.Items.AddRange(new System.Windows.Forms.ToolStripItem[13]
		{
			this.bindingNavigatorMoveFirstItem, this.bindingNavigatorMovePreviousItem, this.bindingNavigatorSeparator, this.bindingNavigatorPositionItem, this.bindingNavigatorCountItem, this.bindingNavigatorSeparator1, this.bindingNavigatorMoveNextItem, this.bindingNavigatorMoveLastItem, this.toolStripSeparator1, this.bindingNavigatorDisplay,
			this.validToolStripButton, this.P0_TMSFile_toolStripButton, this.P0_Ethernet_toolStripButton
		});
		resources.ApplyResources(this.specBindingNavigator, "specBindingNavigator");
		this.specBindingNavigator.MoveFirstItem = this.bindingNavigatorMoveFirstItem;
		this.specBindingNavigator.MoveLastItem = this.bindingNavigatorMoveLastItem;
		this.specBindingNavigator.MoveNextItem = this.bindingNavigatorMoveNextItem;
		this.specBindingNavigator.MovePreviousItem = this.bindingNavigatorMovePreviousItem;
		this.specBindingNavigator.Name = "specBindingNavigator";
		this.specBindingNavigator.PositionItem = this.bindingNavigatorPositionItem;
		this.specBindingSource.DataMember = "Spec";
		this.specBindingSource.DataSource = this.eCSDataSet;
		this.specBindingSource.Filter = "Visible";
		this.eCSDataSet.DataSetName = "ECSDataSet";
		this.eCSDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
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
		this.toolStripSeparator1.Name = "toolStripSeparator1";
		resources.ApplyResources(this.toolStripSeparator1, "toolStripSeparator1");
		this.bindingNavigatorDisplay.Name = "bindingNavigatorDisplay";
		resources.ApplyResources(this.bindingNavigatorDisplay, "bindingNavigatorDisplay");
		this.bindingNavigatorDisplay.KeyDown += new System.Windows.Forms.KeyEventHandler(bindingNavigatorDisplay_KeyDown);
		this.validToolStripButton.Image = ECS.Properties.Resources.Checkbox;
		resources.ApplyResources(this.validToolStripButton, "validToolStripButton");
		this.validToolStripButton.Name = "validToolStripButton";
		this.validToolStripButton.Click += new System.EventHandler(validToolStripButton_Click);
		resources.ApplyResources(this.P0_TMSFile_toolStripButton, "P0_TMSFile_toolStripButton");
		this.P0_TMSFile_toolStripButton.Name = "P0_TMSFile_toolStripButton";
		this.P0_TMSFile_toolStripButton.Click += new System.EventHandler(P0_TMSFile_toolStripButton_Click);
		resources.ApplyResources(this.P0_Ethernet_toolStripButton, "P0_Ethernet_toolStripButton");
		this.P0_Ethernet_toolStripButton.Name = "P0_Ethernet_toolStripButton";
		this.P0_Ethernet_toolStripButton.Click += new System.EventHandler(P0_Ethernet_toolStripButton_Click);
		this.uIDataSet.DataSetName = "UIDataSet";
		this.uIDataSet.Locale = new System.Globalization.CultureInfo("zh-CN");
		this.uIDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		this.specInfoBindingSource.DataMember = "Spec_Info";
		this.specInfoBindingSource.DataSource = this.uIDataSet;
		this.specInfoBindingSource.Sort = "SpecID";
		this.specDataGridView.AllowUserToAddRows = false;
		this.specDataGridView.AllowUserToDeleteRows = false;
		this.specDataGridView.AutoGenerateColumns = false;
		this.specDataGridView.BackgroundColor = System.Drawing.SystemColors.Window;
		this.specDataGridView.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		this.specDataGridView.Columns.AddRange(this.dataGridViewTextBoxColumn1, this.Display, this.dataGridViewTextBoxColumn2, this.Value, this.Valid);
		this.specDataGridView.DataSource = this.specBindingSource;
		resources.ApplyResources(this.specDataGridView, "specDataGridView");
		this.specDataGridView.MultiSelect = false;
		this.specDataGridView.Name = "specDataGridView";
		this.specDataGridView.RowTemplate.Height = 23;
		this.specDataGridView.CellValueChanged += new System.Windows.Forms.DataGridViewCellEventHandler(specDataGridView_CellValueChanged);
		this.specDataGridView.DataError += new System.Windows.Forms.DataGridViewDataErrorEventHandler(specDataGridView_DataError);
		this.specDataGridView.RowsAdded += new System.Windows.Forms.DataGridViewRowsAddedEventHandler(specDataGridView_RowsAdded);
		this.dataGridViewTextBoxColumn1.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.dataGridViewTextBoxColumn1.DataPropertyName = "SpecID";
		this.dataGridViewTextBoxColumn1.FillWeight = 10f;
		resources.ApplyResources(this.dataGridViewTextBoxColumn1, "dataGridViewTextBoxColumn1");
		this.dataGridViewTextBoxColumn1.Name = "dataGridViewTextBoxColumn1";
		this.dataGridViewTextBoxColumn1.ReadOnly = true;
		this.Display.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.Display.FillWeight = 50f;
		resources.ApplyResources(this.Display, "Display");
		this.Display.Name = "Display";
		this.Display.ReadOnly = true;
		this.dataGridViewTextBoxColumn2.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.dataGridViewTextBoxColumn2.FillWeight = 30f;
		resources.ApplyResources(this.dataGridViewTextBoxColumn2, "dataGridViewTextBoxColumn2");
		this.dataGridViewTextBoxColumn2.Name = "dataGridViewTextBoxColumn2";
		this.Value.DataPropertyName = "Value";
		resources.ApplyResources(this.Value, "Value");
		this.Value.Name = "Value";
		this.Valid.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.Valid.DataPropertyName = "Valid";
		this.Valid.FillWeight = 10f;
		resources.ApplyResources(this.Valid, "Valid");
		this.Valid.Name = "Valid";
		this.Valid.SortMode = System.Windows.Forms.DataGridViewColumnSortMode.Automatic;
		this.specTableAdapter.ClearBeforeFill = true;
		resources.ApplyResources(this, "$this");
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		base.Controls.Add(this.specDataGridView);
		base.Controls.Add(this.specBindingNavigator);
		base.Name = "SpecForm";
		base.FormClosing += new System.Windows.Forms.FormClosingEventHandler(SpecForm_FormClosing);
		base.Load += new System.EventHandler(SpecForm_Load);
		((System.ComponentModel.ISupportInitialize)this.specBindingNavigator).EndInit();
		this.specBindingNavigator.ResumeLayout(false);
		this.specBindingNavigator.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.specBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.eCSDataSet).EndInit();
		((System.ComponentModel.ISupportInitialize)this.uIDataSet).EndInit();
		((System.ComponentModel.ISupportInitialize)this.specInfoBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.specDataGridView).EndInit();
		base.ResumeLayout(false);
		base.PerformLayout();
	}
}
